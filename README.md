deleted everything


commented : CMD ["npx", "ts-node", "src/index.ts"]


ran : 
docker build -t my-bot-with-python .


commented : CMD ["/venv/bin/python", "-m", "pip", "list"]  # Debugging to verify installed packages
 

ran : 
docker build -t my-bot-with-python .

ran : 
docker run -it --env-file .env my-bot-with-python


/venv/bin/python3 ./src/Craft/PaperCaptionLarg.py  --input "./user_image.jpg" --output "./assets/OutPut/PaperCaptionLarg2.png" --headline "تیتر کوفتی" --subheadline "زیرتیترشه" --daysintofuture "0" --event1 "undefined" --event2 "undefined" --event3 "undefined" --watermark 0




<!-- ############################################ -->
You can **enter the running Docker container** in interactive mode using the following methods:

---

### **Method 1: Start a Shell in a Running Container**
If your container is already running, first find its **Container ID**:
```bash
docker ps
```
You'll see something like:
```
CONTAINER ID   IMAGE                COMMAND                  CREATED         STATUS        NAMES
abc123456789   my-bot-with-python   "npx ts-node src/in..."  10 minutes ago Up 10 mins    my-bot-container
```
Then, use the **Container ID** or **Name** to open a shell inside it:
```bash
docker exec -it 8702fe5f4e7281303b837962b13cd2cc48381f47f9f962183b7a00e2957b35eb sh
```
or (if your container is named `my-bot-container`):
```bash
docker exec -it my-bot-container sh
```

For a **Debian-based image** (like `bullseye` or `slim`), use `bash` instead of `sh`:
```bash
docker exec -it my-bot-container bash
```

---

### **Method 2: Run the Container with an Interactive Shell**

If the container is **not running**, start it with an interactive shell:
```bash
docker run -it --env-file .env my-bot-with-python sh
```

---

### **Method 3: Attach to a Running Container**

You can also attach to the container's running process:
```bash
docker attach my-bot-container
```
(Use `Ctrl+P` then `Ctrl+Q` to detach without stopping the container.)

---

### **Once Inside the Container**

You can now run commands, for example:
```bash
ls -la  # List files
python --version  # Check Python version
/venv/bin/python -m pip list  # Check installed Python packages
```

To exit, type:
```bash
exit
```

Let me know if you need further guidance! 🚀