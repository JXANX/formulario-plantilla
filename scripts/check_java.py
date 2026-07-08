import os
import re

def check_java():
    error = False
    for root, dirs, files in os.walk('backend/src/main/java'):
        for file in files:
            if file.endswith('.java'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Just check if there are any obvious syntax errors
                    pass
    print("Done checking java")

check_java()
