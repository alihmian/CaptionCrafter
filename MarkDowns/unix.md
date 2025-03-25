
### 🔹 **General Commands**
- `man [command]` – show manual pages for a command
- `history` – show previously executed commands
- `clear` – clear terminal screen
- `exit` – close terminal session

---

### 🔹 **Navigation Commands**
- `pwd` – print working directory
- `cd [directory]` – change directory
  - `cd ~` – go to home directory
  - `cd ..` – go up one directory level
  - `cd -` – return to previous directory
- `ls` – list files and directories
  - `ls -a` – list all files including hidden
  - `ls -l` – detailed listing
  - `ls -lh` – detailed listing with human-readable sizes
- `tree` – display directory structure in a tree format

---

### 🔹 **File Operations**
- `touch [file]` – create empty file or update timestamp
- `cp [source] [destination]` – copy files or directories
  - `cp -r` – copy directories recursively
- `mv [source] [destination]` – move/rename files or directories
- `rm [file]` – delete file
  - `rm -r [directory]` – remove directory recursively
  - `rm -rf [directory]` – force remove without prompt (**use carefully!**)

---

### 🔹 **File Viewing & Editing**
- `cat [file]` – display file content
- `less [file]` – view file content page by page
- `head [file]` – display first lines of file
- `tail [file]` – display last lines of file
  - `tail -f [file]` – follow file updates in real-time
- `nano [file]` – basic text editor
- `vim [file]` – advanced text editor

---

### 🔹 **Permissions**
- `chmod [permissions] [file]` – change file permissions
  - `chmod +x [file]` – make file executable
  - `chmod 755 [file]` – set permissions explicitly
- `chown [user]:[group] [file]` – change file ownership

---

### 🔹 **Search & Find**
- `find [path] -name [file]` – find files/directories by name
- `grep [pattern] [file]` – search within file content
  - `grep -r [pattern] [directory]` – recursively search pattern in directory

---

### 🔹 **Process Management**
- `ps` – list current processes
  - `ps aux` – detailed list of all processes
- `top` – display real-time processes and resource usage
- `htop` – interactive version of top
- `kill [PID]` – terminate process by PID
  - `kill -9 [PID]` – force terminate process (**use carefully!**)

---

### 🔹 **System Information**
- `uname -a` – show system and kernel information
- `df -h` – disk space usage
- `du -sh [directory]` – check directory size
- `free -h` – display memory usage

---

### 🔹 **Networking**
- `ping [host]` – test connectivity
- `ifconfig` or `ip addr` – view network interfaces
- `curl [URL]` – fetch data from URL
- `wget [URL]` – download file from URL
- `ssh user@host` – connect securely to remote server
- `scp file user@host:/path` – secure copy to/from remote server

---

### 🔹 **Compression**
- `tar -czvf archive.tar.gz [files]` – compress files/directories
- `tar -xzvf archive.tar.gz` – extract compressed files
- `zip archive.zip [files]` – create zip archive
- `unzip archive.zip` – extract zip file

---

### 🔹 **Pipes & Redirection**
- `[command] > [file]` – redirect output to file (overwrite)
- `[command] >> [file]` – redirect output to file (append)
- `[command1] | [command2]` – pipe output of command1 as input for command2
- `sort [file]` – sort file contents alphabetically
- `wc [file]` – count lines, words, and characters

