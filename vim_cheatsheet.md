

## 📝 **Vim Cheatsheet**

### 🧭 Modes

| Mode        | What It Does                    | How to Access            |
|-------------|----------------------------------|---------------------------|
| **Normal**  | Navigation & commands            | Press `Esc`               |
| **Insert**  | Typing/editing text              | Press `i`, `a`, `o`, etc. |
| **Visual**  | Select text                      | Press `v` (char), `V` (line), `Ctrl+v` (block) |
| **Command** | Run commands (save, quit, etc.)  | Press `:` in Normal mode  |

---

### ✍️ Insert Mode Commands

| Command | Action                        |
|---------|-------------------------------|
| `i`     | Insert before cursor          |
| `a`     | Insert after cursor           |
| `I`     | Insert at start of line       |
| `A`     | Append at end of line         |
| `o`     | Open new line below           |
| `O`     | Open new line above           |

---

### 🚶‍♂️ Movement (Normal Mode)

| Command | Move to...                     |
|---------|-------------------------------|
| `h`     | Left                           |
| `l`     | Right                          |
| `j`     | Down                           |
| `k`     | Up                             |
| `w`     | Next word                      |
| `b`     | Previous word                  |
| `0`     | Start of line                  |
| `^`     | First non-blank character      |
| `$`     | End of line                    |
| `gg`    | Top of file                    |
| `G`     | Bottom of file                 |
| `:n`    | Go to line `n`                 |

---

### ✂️ Editing & Deleting (Normal Mode)

| Command   | Action                           |
|-----------|----------------------------------|
| `x`       | Delete character under cursor    |
| `dd`      | Delete current line              |
| `dw`      | Delete word                      |
| `D`       | Delete to end of line            |
| `u`       | Undo                             |
| `Ctrl + r`| Redo                             |
| `yy`      | Yank (copy) line                 |
| `p`       | Paste after cursor               |
| `P`       | Paste before cursor              |
| `r<char>` | Replace character under cursor   |
| `~`       | Toggle case of current char      |

---

### 🔍 Search

| Command         | Action                      |
|-----------------|-----------------------------|
| `/text`         | Search forward for “text”   |
| `?text`         | Search backward for “text”  |
| `n`             | Repeat search forward       |
| `N`             | Repeat search backward      |

---

### 💾 File Commands (Command Mode — `:`)

| Command | Action                    |
|---------|---------------------------|
| `:w`    | Save                      |
| `:q`    | Quit                      |
| `:wq`   | Save and quit             |
| `:q!`   | Quit without saving       |
| `:e filename` | Open another file   |
| `:w filename` | Save as new file    |

---

### 🛠️ Useful Tricks

| Command      | What it does                         |
|--------------|--------------------------------------|
| `:%s/old/new/g` | Replace all `old` with `new`       |
| `:set number`   | Show line numbers                 |
| `:set relativenumber` | Show relative line numbers  |
| `Ctrl + o / i`  | Jump backward/forward in jump list|
| `.`            | Repeat last change                |

---

### 🚀 Exiting Vim (in case you're stuck 😅)

```bash
Esc :q!      # Quit without saving
Esc :wq      # Save and quit
Esc ZZ       # Save and quit (shortcut)
```

---

Want this as a downloadable or printable version? I can give you Markdown or PDF too!