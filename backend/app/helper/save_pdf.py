import os  # For path operations like join, exists
import shutil  # For copying file-like objects efficiently
from datetime import datetime  # For getting current timestamp
from typing import BinaryIO  # Type hint for file-like object
from pathlib import Path
import asyncio

def save_pdf_to_server(source_file: BinaryIO,committeeNo: str,committeeDate: str,count: int,dest_dir: str) -> str:
    """
    Save uploaded PDF file into a dynamic directory structure (base_dir/year),
    ensuring unique filenames and preventing overwrites.

    Args:
        source_file (BinaryIO): The uploaded file (from request).
        committeeNo (str): Committee number (part of filename).
        committeeDate (str): Committee date in format 'YYYY-MM-DD'.
        count (int): Current count of PDFs (used to increment filename).
        dest_dir (str): Base upload directory (from settings).

    Returns:
        str: Final saved file path.
    """

    #  Extract year from committeeDate (must be YYYY-MM-DD)
    year = datetime.strptime(committeeDate, "%Y-%m-%d").year
    directoyYear = datetime.now().year


    print("year",directoyYear)

    #  Create year subdirectory dynamically
    year_dir = Path(dest_dir) / str(directoyYear)
    year_dir.mkdir(parents=True, exist_ok=True)

    #  Generate timestamp for unique filenames
    now = datetime.now()
    timestamp = now.strftime("%Y-%m-%d_%I-%M-%S-%p")

    #  Construct filename: committeeNo.year.count+1-timestamp.pdf
    filename = f"{committeeNo}.{year}.{count + 1}-{timestamp}.pdf"

    #  Final destination path
    dest_path = year_dir / filename
    print(f"Saving PDF to: {dest_path}")

    #  Check if file already exists
    if dest_path.exists():
        raise FileExistsError(f"PDF already exists at {dest_path}")

    #  Write uploaded file to destination
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(source_file, buffer)

    #  Return saved file path as string
    return str(dest_path)


async def async_delayed_delete(file_path: str, delay_sec: int = 3):
    await asyncio.sleep(delay_sec)
    try:
        os.remove(file_path)
        print(f" Async deleted: {file_path}")
    except Exception as e:
        print(f" Async deletion failed: {e}")




