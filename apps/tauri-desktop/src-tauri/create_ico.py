#!/usr/bin/env python3
"""
Simple script to create a basic ICO file from PNG
"""
import struct

def create_simple_ico():
    # Create a minimal 16x16 ICO file
    # ICO header
    ico_header = struct.pack('<HHH', 0, 1, 1)  # Reserved, Type (1=ICO), Count
    
    # ICO directory entry
    ico_dir = struct.pack('<BBBBHHII', 
                         16, 16,  # Width, Height
                         0, 0,    # Colors, Reserved
                         1, 32,   # Planes, BitCount
                         40 + 16*16*4,  # Size of bitmap data
                         22)      # Offset to bitmap data
    
    # Bitmap info header
    bmp_header = struct.pack('<IIIHHIIIIIII',
                            40,      # Size of this header
                            16, 32,  # Width, Height (height is doubled for ICO)
                            1, 32,   # Planes, BitCount
                            0, 0,    # Compression, SizeImage
                            0, 0,    # XPelsPerMeter, YPelsPerMeter
                            0, 0)    # ClrUsed, ClrImportant
    
    # Simple 16x16 blue square bitmap data (BGRA format)
    pixel_data = b'\x80\x80\xFF\xFF' * (16 * 16)  # Blue pixels
    
    # AND mask (all transparent)
    and_mask = b'\x00' * (16 * 2)  # 16 pixels per row, 2 bytes per row (padded)
    
    with open('icons/icon.ico', 'wb') as f:
        f.write(ico_header)
        f.write(ico_dir)
        f.write(bmp_header)
        f.write(pixel_data)
        f.write(and_mask)

if __name__ == '__main__':
    create_simple_ico()
    print("Created simple icon.ico")
