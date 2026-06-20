import os
import pandas as pd

for file in os.listdir('.'):
    if file.endswith('.csv'):
        try:
            df = pd.read_csv(file)
            print(f'{file}: {len(df)}')
        except:
            pass
    elif file.endswith('.xlsx'):
        try:
            df = pd.read_excel(file)
            print(f'{file}: {len(df)}')
        except:
            pass

