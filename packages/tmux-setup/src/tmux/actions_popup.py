#!/usr/bin/env python3
"""tmux Actions — interactive multi-column grid menu."""
import os, sys, termios, re, subprocess, select

PANE = sys.argv[1] if len(sys.argv) > 1 else ""

# Catppuccin Frappe palette
HDR = '\033[1;38;2;140;170;238m'
KEY = '\033[1;38;2;229;200;144m'
TXT = '\033[0;38;2;198;208;245m'
DIM = '\033[0;38;2;65;69;89m'
SEP = '\033[0;38;2;115;121;148m'
HBG = '\033[48;2;67;70;89m'
HK  = '\033[1;38;2;255;213;116m'
HT  = '\033[1;38;2;220;224;255m'
RST = '\033[0m'

W = 26  # cell content width (popup must be >= W*3 + 8)

# All keys are lowercase. ("---", label) = separator. ("", "") = empty padding.
COLS = [
    [("z","  Zoom / unzoom pane"),("p","  Previous window"),("n","  Next window"),
     ("w","  List windows & sessions"),("a","  New window"),("x","  Kill window"),
     ("s","  Rename session"),("q","  Kill session"),("d","  Detach"),
     ("","")],
    [("h","  Split top / bottom"),("v","  Split left / right"),("k","  Kill pane"),
     (",","  Rename window"),
     ("---","Pane Movement"),
     ("u","  Swap pane \u2190 prev"),("j","  Swap pane \u2192 next"),
     ("e","  Break to new window"),("m","  Move to window\u2026"),("l","  Pull from window\u2026")],
    [("f","  Float terminal"),("t","  Scratch terminal (M-i)"),
     ("y","  Save session"),("r","  Restore session"),
     ("---","Clipboard"),
     ("c","  Copy mode"),("i","  Paste image"),
     ("o","  Open URL / file"),("g","  Search in browser"),
     ("R","  Recenter layout")],
    [("E","  Neovim (M-e)"),("N","  NvimTree"),("Y","  Yazi file manager"),("G","  Lazygit"),
     ("D","  Lazydocker"),("C","  WSL cleanup"),("",""),("",""),("",""),("","")],
]

NR = max(len(c) for c in COLS)
NC = len(COLS)

def selectable(c, r):
    if not (0 <= c < NC and 0 <= r < len(COLS[c])): return False
    k, _ = COLS[c][r]
    return bool(k) and k != "---"

def render_cell(c, r, hl):
    if r >= len(COLS[c]): return ' ' * W
    k, d = COLS[c][r]
    if not k: return ' ' * W
    if k == "---":
        s = f"\u2500\u2500 {d} "
        s += '\u2500' * max(0, W - len(s))
        return f"{SEP}{s[:W]}{RST}"
    dp = d + ' ' * max(0, W - 1 - len(d))
    if hl: return f"{HBG}{HK}{k}{HT}{dp}{RST}"
    return f"{KEY}{k}{TXT}{dp}{RST}"

def hline(l, m, r):
    s = '\u2500' * (W + 2)
    segs = s + (m + s) * (NC - 1)
    return f"{DIM}{l}{segs}{r}{RST}\n"

def data_row_line(r, sc, sr):
    cells = [render_cell(c, r, sc == c and sr == r) for c in range(NC)]
    inner = f" {DIM}\u2502{RST} ".join(cells)
    return f"{DIM}\u2502{RST} {inner} {DIM}\u2502{RST}"

# Row layout: │ SP cell0 SP │ SP cell1 SP │ ... SP │
# col c content starts at x = 3 + c*(W+3), ends at x = 2 + (c+1)*W + c*3
# (1-indexed terminal columns, matching SGR mouse report)
COL_LEFT = [3 + c * (W + 3) for c in range(NC)]
# Row 1=title 2=top-border 3=header 4=separator, data rows start at row 5
DATA_Y0 = 5

def draw(sc, sr):
    iw = W * NC + (NC - 1) * 3 + 2
    out = ["\033[2J\033[H",
           f"{HDR}  {'tmux Actions':<{iw}}{RST}\n",
           hline('\u250c', '\u252c', '\u2510')]
    hdr_names = [' Window & Session', ' Pane Controls', ' Tools & Clipboard', ' Launch']
    hdrs = [f"{HDR}{h:<{W}}{RST}" for h in hdr_names[:NC]]
    inner = f" {DIM}\u2502{RST} ".join(hdrs)
    out.append(f"{DIM}\u2502{RST} {inner} {DIM}\u2502{RST}\n")
    out.append(hline('\u251c', '\u253c', '\u2524'))
    for r in range(NR):
        out.append(data_row_line(r, sc, sr) + "\n")
    out.append(hline('\u2514', '\u2534', '\u2518'))
    out.append(f"\n{DIM}  \u2191\u2193\u2190\u2192 navigate \u00b7 Enter / click to run \u00b7 Esc cancel{RST}")
    # Park cursor at top-left so subsequent absolute positioning never scrolls
    out.append("\033[1;1H")
    sys.stdout.write(''.join(out))
    sys.stdout.flush()

def update(old_sc, old_sr, sc, sr):
    # Position once at first data row then write sequentially with \n.
    # \n → \r\n (ONLCR) so cursor always resets to col 1, avoiding pending-wrap
    # state that breaks absolute positioning when content fills the line exactly.
    out = [f"\033[{DATA_Y0};1H"]
    for r in range(NR):
        out.append(data_row_line(r, sc, sr))
        if r < NR - 1:
            out.append("\n")
    out.append("\033[1;1H")
    sys.stdout.write(''.join(out))
    sys.stdout.flush()

def x2col(x):
    for c in range(NC):
        if COL_LEFT[c] <= x <= COL_LEFT[c] + W - 1: return c
    return -1

def y2row(y): return y - 5

def move(sc, sr, dc, dr):
    if dr:
        r = sr + dr
        while 0 <= r < NR:
            if selectable(sc, r): return sc, r
            r += dr
        return sc, sr
    if dc:
        c = sc + dc
        while 0 <= c < NC:
            if selectable(c, sr): return c, sr
            best_r, best_d = sr, NR
            for r in range(NR):
                if selectable(c, r):
                    d = abs(r - sr)
                    if d < best_d: best_d, best_r = d, r
            if best_d < NR: return c, best_r
            c += dc
        return sc, sr
    return sc, sr

def tmux(*args, bg=False):
    fn = subprocess.Popen if bg else subprocess.run
    fn(['tmux'] + list(args))

def execute(key):
    T = (['-t', PANE] if PANE else [])
    r = subprocess.run(['tmux', 'display-message', '-p'] + (['-t', PANE] if PANE else []) +
                       ['#{pane_current_path}'], capture_output=True, text=True)
    cwd = r.stdout.strip()
    c_args = (['-c', cwd] if cwd else [])
    H = os.path.expanduser('~')

    dispatch = {
        'z': lambda: tmux('resize-pane', '-Z', *T),
        'p': lambda: tmux('previous-window'),
        'n': lambda: tmux('next-window'),
        'w': lambda: tmux('run-shell', '-b', "sleep 0.15 && tmux choose-tree -s"),
        'a': lambda: tmux('new-window', *c_args),
        'x': lambda: tmux('run-shell', '-b', "sleep 0.1 && tmux kill-window"),
        # rename-session: lock flag prevents pane-title-changed hook from overriding manual name
        's': lambda: tmux('run-shell', '-b', "sleep 0.15 && tmux command-prompt -I '#{session_name}' \"rename-session -- '%%' \\; set-option @session-name-locked 1\""),
        'q': lambda: tmux('run-shell', '-b', "sleep 0.1 && tmux kill-session"),
        'd': lambda: tmux('detach-client'),
        'h': lambda: tmux('split-window', '-v', *c_args),
        'v': lambda: tmux('split-window', '-h', *c_args),
        'k': lambda: tmux('run-shell', '-b', f"sleep 0.1 && tmux kill-pane{' -t ' + PANE if PANE else ''}"),
        # rename-window: lock flag prevents pane-title-changed hook from overriding manual name
        ',': lambda: tmux('run-shell', '-b', "sleep 0.15 && tmux command-prompt -I '#W' \"rename-window -- '%%' \\; set-option -w @window-name-locked 1\""),
        'u': lambda: tmux('swap-pane', '-U', *T),
        'j': lambda: tmux('swap-pane', '-D', *T),
        'e': lambda: tmux('break-pane', *T),
        'm': lambda: tmux('run-shell', '-b', "sleep 0.2 && tmux choose-tree -w 'join-pane -t \"%%\"'"),
        'l': lambda: tmux('run-shell', '-b', "sleep 0.2 && tmux choose-tree -w 'join-pane -s \"%%\"'"),
        'f': lambda: tmux('run-shell', '-b', f"sleep 0.2 && bash ~/.config/tmux/bin/float_term.sh '{PANE}'"),
        't': lambda: tmux('run-shell', '-b', f"sleep 0.2 && tmux popup -d '{cwd or H}' -xC -yC -w70% -h70% -E 'tmux new -A -s floating'"),
        'y': lambda: tmux('run-shell', '~/.tmux/plugins/tmux-resurrect/scripts/save.sh'),
        'r': lambda: tmux('run-shell', '~/.tmux/plugins/tmux-resurrect/scripts/restore.sh'),
        'c': lambda: tmux('copy-mode', *T),
        'i': lambda: tmux('run-shell', '-b', f"bash ~/.config/tmux/bin/paste_image_wrapper.sh '{PANE}'"),
        'o': lambda: tmux('run-shell', '-b', 'bash ~/.config/tmux/bin/open_clip.sh url'),
        'g': lambda: tmux('run-shell', '-b', 'bash ~/.config/tmux/bin/open_clip.sh search'),
        'R': lambda: tmux('run-shell', '-b', 'bash ~/.config/tmux/bin/recenter.sh'),
        'E': lambda: tmux('run-shell', '-b', f"sleep 0.2 && tmux split-window -h -c '{cwd}' nvim"),
        'N': lambda: tmux('run-shell', '-b', f"sleep 0.2 && tmux split-window -h -c '{cwd}' 'nvim +NvimTree'"),
        'Y': lambda: tmux('run-shell', '-b', f"sleep 0.2 && tmux split-window -h -c '{cwd}' yazi"),
        'G': lambda: tmux('run-shell', '-b', f"sleep 0.2 && tmux split-window -h -c '{cwd}' lazygit"),
        'D': lambda: tmux('run-shell', '-b', f"sleep 0.2 && tmux split-window -h -c '{cwd}' lazydocker"),
        'C': lambda: tmux('run-shell', '-b', f"sleep 0.2 && tmux split-window -v -c '{cwd}' 'bash ~/.config/tmux/bin/wsl_cleanup.sh; read -p \"Press Enter to close\"'"),
    }
    if key in dispatch:
        dispatch[key]()

def set_raw_input(fd):
    """Enable raw input while keeping output processing (ONLCR) intact.
    tty.setraw() disables OPOST which strips the CR from \\n, causing
    each output line to drift right. We only want to affect input flags."""
    new = termios.tcgetattr(fd)
    new[0] &= ~(termios.BRKINT | termios.ICRNL | termios.INPCK |
                termios.ISTRIP | termios.IXON)
    new[2]  =  (new[2] & ~termios.CSIZE) | termios.CS8
    new[3] &= ~(termios.ECHO | termios.ICANON | termios.IEXTEN | termios.ISIG)
    new[6][termios.VMIN]  = 1
    new[6][termios.VTIME] = 0
    # new[1] (output flags) left untouched — keeps OPOST/ONLCR so \n → \r\n
    termios.tcsetattr(fd, termios.TCSADRAIN, new)

def main():
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)

    sc, sr = 0, 0
    while not selectable(sc, sr) and sr < NR - 1: sr += 1

    try:
        set_raw_input(fd)
        # Clear, hide cursor, disable auto-wrap, enable SGR mouse + motion tracking
        # ?7l = no-auto-wrap: prevents pending-wrap state when content fills line exactly
        sys.stdout.write('\033[2J\033[H\033[?25l\033[?7l\033[?1000h\033[?1006h\033[?1003h')
        sys.stdout.flush()
        draw(sc, sr)

        result = None
        buf = b''

        while result is None:
            rdy, _, _ = select.select([fd], [], [], 2.0)
            if not rdy: continue
            buf += os.read(fd, 128)
            # Drain all pending input before processing — collapses rapid motion events
            # into a single redraw instead of one per mouse-move event.
            while True:
                more, _, _ = select.select([fd], [], [], 0)
                if not more: break
                buf += os.read(fd, 128)

            nc, nr = sc, sr  # track desired final position across all buffered events

            while buf and result is None:
                ch = buf[0:1]

                if ch == b'\x1b':
                    if len(buf) < 2:
                        # Peek briefly to distinguish bare ESC from a multi-byte sequence
                        r2, _, _ = select.select([fd], [], [], 0.05)
                        if r2: buf += os.read(fd, 128)
                    if len(buf) < 2 or buf[1:2] != b'[':
                        result = ''   # bare ESC → quit
                        break
                    i = 2
                    while i < len(buf) and buf[i] not in b'ABCDHFMPQRSmnlh~': i += 1
                    if i >= len(buf): break  # incomplete sequence — wait for more
                    seq = buf[:i+1].decode('latin-1', errors='replace')
                    buf = buf[i+1:]

                    if   seq == '\033[A': nc, nr = move(nc, nr, 0, -1)   # up arrow
                    elif seq == '\033[B': nc, nr = move(nc, nr, 0,  1)   # down arrow
                    elif seq == '\033[D': nc, nr = move(nc, nr, -1, 0)   # left arrow
                    elif seq == '\033[C': nc, nr = move(nc, nr,  1, 0)   # right arrow
                    else:
                        m = re.match(r'\x1b\[<(\d+);(\d+);(\d+)([Mm])', seq)
                        if m:
                            btn, mx, my, typ = int(m[1]), int(m[2]), int(m[3]), m[4]
                            if btn == 64:                        # scroll up → navigate up
                                nc, nr = move(nc, nr, 0, -1)
                            elif btn == 65:                      # scroll down → navigate down
                                nc, nr = move(nc, nr, 0,  1)
                            else:
                                c2, r2 = x2col(mx), y2row(my)
                                if c2 >= 0 and 0 <= r2 < NR and selectable(c2, r2):
                                    if 32 <= btn < 96:           # motion → hover
                                        nc, nr = c2, r2
                                    elif btn == 0 and typ == 'M':  # left click → execute
                                        nc, nr = c2, r2
                                        if nc != sc or nr != sr:
                                            old_sc, old_sr = sc, sr
                                            sc, sr = nc, nr
                                            update(old_sc, old_sr, sc, sr)
                                        result = COLS[sc][sr][0]

                elif ch in (b'\r', b'\n'):
                    buf = buf[1:]
                    if selectable(sc, sr): result = COLS[sc][sr][0]
                    else: result = ''

                elif ch in (b'\x03', b'\x04'):   # Ctrl+C / Ctrl+D
                    buf = buf[1:]
                    result = ''

                else:
                    # Direct key: jump selection to matching action (no immediate execute)
                    key_char = ch.decode('latin-1', errors='ignore')
                    buf = buf[1:]
                    for cc in range(NC):
                        for rr in range(len(COLS[cc])):
                            if selectable(cc, rr) and COLS[cc][rr][0] == key_char:
                                nc, nr = cc, rr
                                break
                        else:
                            continue
                        break

            # Single redraw per event batch — replaces per-event update() calls
            if result is None and (nc != sc or nr != sr):
                old_sc, old_sr = sc, sr
                sc, sr = nc, nr
                update(old_sc, old_sr, sc, sr)

    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)
        sys.stdout.write('\033[?1003l\033[?1006l\033[?1000l\033[?7h\033[?25h\033[2J\033[H')
        sys.stdout.flush()

    if result:
        execute(result)

if __name__ == '__main__':
    main()
