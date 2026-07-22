import pandas as pd
import openpyxl

try:
    df = pd.read_excel('测试.xlsx')
    print("Excel文件读取成功！")
    print("\n数据预览:")
    print(df)
    print("\n列名:", df.columns.tolist())
    print("\n数据形状:", df.shape)
except Exception as e:
    print(f"读取Excel文件时出错: {e}")
    import traceback
    traceback.print_exc()
