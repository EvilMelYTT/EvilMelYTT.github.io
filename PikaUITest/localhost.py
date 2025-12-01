import http.server, socketserver, threading, os, sys, time, subprocess

if os.name=="nt":
    subprocess.call('title Server', shell=True)

try:
    import msvcrt
    def k(t=None):
        s=time.time()
        while 1:
            if msvcrt.kbhit(): return msvcrt.getwch()
            if t and time.time()-s>=t: return
            time.sleep(.01)
except:
    try:
        import termios, tty, select
        def k(t=None):
            fd=sys.stdin.fileno()
            o=termios.tcgetattr(fd)
            try:
                tty.setcbreak(fd)
                r,_,_=select.select([fd],[],[],t)
                return sys.stdin.read(1) if r else None
            finally:
                termios.tcsetattr(fd,termios.TCSADRAIN,o)
    except:
        def k(t=None):
            try: return input()[:1]
            except: return

class S(socketserver.TCPServer): allow_reuse_address=1

def mk(p,d,b):
    h=http.server.SimpleHTTPRequestHandler
    def f(*a,**kw): return h(*a,directory=d,**kw)
    return S((b,p),f)

class C:
    def __init__(s,p,d,b):
        s.p=p; s.d=os.path.abspath(d); s.b=b; s.h=None; s.t=None
    def start(s):
        if s.h: return
        os.chdir(s.d)
        s.h=mk(s.p,s.d,s.b)
        s.t=threading.Thread(target=s.h.serve_forever,daemon=1)
        s.t.start()
        print(f"Serving {s.d} on http://{s.b}:{s.p}/ (r restart, q quit)")
    def stop(s):
        if not s.h: return
        try: s.h.shutdown(); s.h.server_close()
        except: pass
        if s.t: s.t.join(.3)
        s.h=s.t=None
    def restart(s):
        print("Restarting..."); s.stop(); time.sleep(.1); s.start()

def run(p,d,b):
    c=C(p,d,b); c.start()
    try:
        while 1:
            ch=k(.2)
            if ch:
                ch=ch.lower()
                if ch=="r": c.restart()
                elif ch=="q": c.stop(); break
    except KeyboardInterrupt:
        c.stop()

if __name__=="__main__":
    p=8000; d="."; b="127.0.0.1"
    for a in sys.argv[1:]:
        if a.startswith("--port="): p=int(a.split("=",1)[1])
        elif a.startswith("--dir="): d=a.split("=",1)[1]
        elif a.startswith("--bind="): b=a.split("=",1)[1]
    if not os.path.isdir(d): sys.exit(1)
    run(p,d,b)
