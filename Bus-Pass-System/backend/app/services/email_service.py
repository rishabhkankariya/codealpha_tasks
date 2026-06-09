import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import os
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_receipt_email(to_email: str, subject: str, body: str, attachment_path: str = None) -> bool:
    """
    Send an email with an optional attachment using SMTP.
    Returns True if sent successfully, False otherwise.
    """
    # If credentials are not configured, warn and return True to avoid breaking the payment capture flow.
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP email credentials not set in environment variables (SMTP_USERNAME / SMTP_PASSWORD). "
            "Skipping receipt email sending."
        )
        return True
        
    sender_email = settings.SMTP_SENDER_EMAIL or settings.SMTP_USERNAME
    
    try:
        msg = MIMEMultipart()
        msg['From'] = f"PMPML Transit <{sender_email}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        if attachment_path and os.path.exists(attachment_path):
            filename = os.path.basename(attachment_path)
            with open(attachment_path, "rb") as attachment:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.read())
                
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename= {filename}",
            )
            msg.attach(part)
            
        # Connect to server
        smtp_host = settings.SMTP_HOST
        smtp_port = settings.SMTP_PORT
        
        # Determine port connection method
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
            
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        
        logger.info(f"Email receipt successfully sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email notification to {to_email}: {e}")
        return False
