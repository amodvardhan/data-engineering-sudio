import logging
from logging.handlers import RotatingFileHandler

def configure_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(name)-25s | %(message)s",
        handlers=[
            RotatingFileHandler(
                "app.log",
                maxBytes=10 * 1024 * 1024,  # 10 MB per log file
                backupCount=5
            ),
            logging.StreamHandler()
        ]
    )
