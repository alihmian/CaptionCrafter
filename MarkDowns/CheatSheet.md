

# 🐍 Python Virtual Environment & Package Management Cheatsheet

## **1️⃣ Creating a Virtual Environment (venv)**
On macOS, Python3 comes pre-installed. Follow these steps to create and use a virtual environment:

### **📌 Step 1: Check if Python3 is Installed**
Run:
```bash
python3 --version
```
If not installed, install it via Homebrew:
```bash
brew install python3
```

### **📌 Step 2: Create a Virtual Environment**
Navigate to your project folder:
```bash
cd /path/to/your/project
```
Then, create a virtual environment:
```bash
python3 -m venv venv
```
> This creates a folder named `venv` that contains the isolated Python environment.

### **📌 Step 3: Activate the Virtual Environment**
Run:
```bash
source venv/bin/activate
```
Once activated, your terminal will show `(venv)` before the command prompt.

### **📌 Step 4: Deactivate the Virtual Environment**
To exit the virtual environment, run:
```bash
deactivate
```

---

## **2️⃣ Installing Packages**
Once inside the virtual environment, you can install Python packages using `pip`:

### **📌 Install a Specific Package**
```bash
pip install package_name
```
Example:
```bash
pip install numpy
```

### **📌 Install Multiple Packages (from a requirements file)**
If you have a `requirements.txt` file:
```bash
pip install -r requirements.txt
```

### **📌 Save Installed Packages**
To save all installed packages to `requirements.txt`:
```bash
pip freeze > requirements.txt
```

---

## **3️⃣ Uninstalling & Managing Packages**
### **📌 Uninstall a Package**
```bash
pip uninstall package_name
```

### **📌 List Installed Packages**
```bash
pip list
```

### **📌 Check for Package Updates**
```bash
pip list --outdated
```

### **📌 Upgrade a Package**
```bash
pip install --upgrade package_name
```

---

## **4️⃣ Bonus: Virtual Environment Using `virtualenv` (Alternative)**
If `venv` is not available or you prefer `virtualenv`, install it:
```bash
pip install virtualenv
```
Then create a virtual environment:
```bash
virtualenv venv
```
Activate it:
```bash
source venv/bin/activate
```



## **5️⃣ Setting Up a `.gitignore` for Python Projects**
When using Git, you should exclude unnecessary files from being tracked. The `.gitignore` file helps with this.

### **📌 Step 1: Create a `.gitignore` File**
Inside your project directory, run:
```bash
touch .gitignore
```
Then, open it with a text editor:
```bash
nano .gitignore
```
or in VS Code:
```bash
code .gitignore
```

### **📌 Step 2: Add Common Python `.gitignore` Rules**
Copy and paste the following into `.gitignore`:

```gitignore
# Ignore virtual environment folder
venv/

# Byte-compiled files
__pycache__/
*.pyc
*.pyo
*.pyd

# Logs and database files
*.log
*.sqlite3
*.db

# VS Code settings
.vscode/

# Jupyter Notebook checkpoints
.ipynb_checkpoints/

# macOS system files
.DS_Store

# Environment variables
.env
```

### **📌 Step 3: Add & Commit the `.gitignore` File**
Run the following Git commands:
```bash
git add .gitignore
git commit -m "Added .gitignore file"
```

---

## **6️⃣ Uninstalling & Managing Packages**
### **📌 Uninstall a Package**
```bash
pip uninstall package_name
```

### **📌 List Installed Packages**
```bash
pip list
```

### **📌 Check for Package Updates**
```bash
pip list --outdated
```

### **📌 Upgrade a Package**
```bash
pip install --upgrade package_name
```

---

## **7️⃣ Bonus: Virtual Environment Using `virtualenv` (Alternative)**
If `venv` is not available or you prefer `virtualenv`, install it:
```bash
pip install virtualenv
```
Then create a virtual environment:
```bash
virtualenv venv
```
Activate it:
```bash
source venv/bin/activate
```

