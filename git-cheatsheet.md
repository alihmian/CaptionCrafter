

# 🚀 Git Cheatsheet

A quick reference guide for **Git** commands and workflows.

---

## 🛠️ **1️⃣ Basic Git Setup**
### **📌 Configure Git (First-Time Setup)**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### **📌 Check Git Configuration**
```bash
git config --list
```

---

## 📂 **2️⃣ Initialize & Clone a Repository**
### **📌 Initialize a Git Repository**
```bash
git init
```
> This creates a new `.git` directory in your project.

### **📌 Clone an Existing Repository**
```bash
git clone <repository-url>
```
Example:
```bash
git clone https://github.com/user/repo.git
```

---

## 📦 **3️⃣ Staging, Committing, & Pushing**
### **📌 Check Repository Status**
```bash
git status
```

### **📌 Stage Files for Commit**
```bash
git add <file>        # Add a specific file
git add .             # Add all changes in the project
```

### **📌 Commit Changes**
```bash
git commit -m "Commit message"
```

### **📌 Push to Remote Repository**
```bash
git push origin <branch>
```
Example:
```bash
git push origin main
```

---

## 🔄 **4️⃣ Pulling & Fetching**
### **📌 Pull Latest Changes from Remote**
```bash
git pull origin <branch>
```
Example:
```bash
git pull origin main
```

### **📌 Fetch Remote Updates (Without Merging)**
```bash
git fetch
```

---

## 🌲 **5️⃣ Branching & Merging**
### **📌 List All Branches**
```bash
git branch          # Show local branches
git branch -r       # Show remote branches
git branch -a       # Show all branches
```

### **📌 Create a New Branch**
```bash
git branch <new-branch-name>
```

### **📌 Switch to a Branch**
```bash
git checkout <branch-name>
```
or (modern alternative):
```bash
git switch <branch-name>
```

### **📌 Create & Switch to a New Branch**
```bash
git checkout -b <new-branch-name>
```
or:
```bash
git switch -c <new-branch-name>
```

### **📌 Merge a Branch into the Current Branch**
```bash
git merge <branch-name>
```

### **📌 Delete a Branch**
```bash
git branch -d <branch-name>    # Delete local branch
git push origin --delete <branch-name>  # Delete remote branch
```

---

## 🔄 **6️⃣ Undoing Changes**
### **📌 Unstage a File (Before Committing)**
```bash
git reset <file>
```

### **📌 Undo Last Commit (Keep Changes in Staging)**
```bash
git reset --soft HEAD~1
```

### **📌 Undo Last Commit (Discard Changes)**
```bash
git reset --hard HEAD~1
```

### **📌 Revert a Specific Commit**
```bash
git revert <commit-hash>
```

### **📌 Discard Local Changes**
```bash
git checkout -- <file>
```

---

## 🔍 **7️⃣ Viewing History**
### **📌 Show Commit Log**
```bash
git log
git log --oneline --graph --decorate --all  # Pretty log
```

### **📌 Show a Specific Commit**
```bash
git show <commit-hash>
```

### **📌 Show Changes in Staging**
```bash
git diff --staged
```

### **📌 Show Changes Between Two Commits**
```bash
git diff <commit1> <commit2>
```

---

## 🖥 **8️⃣ Working with Remote Repositories**
### **📌 Add a Remote Repository**
```bash
git remote add origin <repository-url>
```

### **📌 Show Remote URLs**
```bash
git remote -v
```

### **📌 Change the Remote URL**
```bash
git remote set-url origin <new-url>
```

---

## 🔀 **9️⃣ Stashing & Cleaning**
### **📌 Save Uncommitted Changes (Stash)**
```bash
git stash
```

### **📌 Apply Stashed Changes**
```bash
git stash pop
```

### **📌 Remove All Stashed Changes**
```bash
git stash clear
```

### **📌 Remove Untracked Files**
```bash
git clean -f
```

---

## 🛠 **🔟 Advanced Git**
### **📌 Rebase (Move Changes Onto Another Branch)**
```bash
git rebase <branch-name>
```

### **📌 Squash Commits (Combine Multiple Commits)**
```bash
git rebase -i HEAD~3
```
> Replace `pick` with `squash` to merge commits.

### **📌 Cherry-Pick a Commit**
```bash
git cherry-pick <commit-hash>
```

### **📌 Reset to a Specific Commit**
```bash
git reset --hard <commit-hash>
```

---

## 🔥 **11️⃣ GitHub-Specific Commands**
### **📌 Create a New Repository on GitHub**
```bash
gh repo create <repo-name> --public
```

### **📌 Fork a Repository**
```bash
gh repo fork <repo-url>
```

### **📌 Create a Pull Request**
```bash
gh pr create --base main --head feature-branch --title "New Feature" --body "Description of feature"
```

---

## 📌 **12️⃣ Helpful Aliases**
You can set up aliases for commonly used Git commands:
```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm "commit -m"
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --decorate --all"
```

