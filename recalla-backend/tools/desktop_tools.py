"""
Desktop tools — let the assistant act on this computer.

SAFETY MODEL
------------
An LLM deciding what to run on your machine is only acceptable with hard
limits, so this module never executes arbitrary shell input. Instead:

  * Apps come from a fixed allowlist (APP_ALLOWLIST). A name that isn't on
    the list is refused, not passed through to a shell.
  * Every path is resolved and must land inside HOME. "..", symlinks and
    absolute paths pointing elsewhere are rejected after resolution, not by
    string matching.
  * Nothing is deleted or overwritten. The only write operations are
    "create a directory" and "create a file that does not already exist".
  * Every call uses a fixed argument list (never shell=True), so quoting
    tricks cannot inject a second command.

Anything outside these limits should stay outside this file.
"""

import os
import re
import shutil
import subprocess
from pathlib import Path

HOME = Path.home().resolve()

# Only these can be launched, and only by these exact commands.
APP_ALLOWLIST = {
    "vscode":    ["code"],
    "code":      ["code"],
    "files":     ["nautilus"],
    "browser":   ["xdg-open", "https://"],   # completed with a URL at call time
    "firefox":   ["firefox"],
    "terminal":  ["gnome-terminal"],
    "calculator":["gnome-calculator"],
    "text":      ["gedit"],
}

# Project scaffolds. Kept deliberately tiny — this creates a starting point,
# not a framework install.
PROJECT_TEMPLATES = {
    "empty":  {},
    "python": {
        "main.py": 'def main():\n    print("Hello from {name}")\n\n\nif __name__ == "__main__":\n    main()\n',
        "requirements.txt": "",
        "README.md": "# {name}\n",
        ".gitignore": "__pycache__/\n*.pyc\nvenv/\n.env\n",
    },
    "web": {
        "index.html": '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>{name}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>{name}</h1>\n  <script src="script.js"></script>\n</body>\n</html>\n',
        "style.css": "body {{ font-family: system-ui, sans-serif; margin: 2rem; }}\n",
        "script.js": 'console.log("{name} ready");\n',
        "README.md": "# {name}\n",
    },
    "node": {
        "index.js": 'console.log("Hello from {name}");\n',
        "package.json": '{{\n  "name": "{slug}",\n  "version": "1.0.0",\n  "main": "index.js",\n  "scripts": {{ "start": "node index.js" }}\n}}\n',
        "README.md": "# {name}\n",
        ".gitignore": "node_modules/\n.env\n",
    },
}


class DesktopError(Exception):
    """Raised when a request falls outside what this module is allowed to do."""


# ── Path safety ──────────────────────────────────────────────────────────────

def _safe_path(raw: str, must_exist: bool = False) -> Path:
    """
    Resolve `raw` and confirm it stays inside HOME.

    Resolution happens before the check, so "../.." and symlinks pointing out
    of HOME are caught rather than slipping past a string comparison.
    """
    if not raw or not str(raw).strip():
        raise DesktopError("No path given")

    text = os.path.expanduser(str(raw).strip())
    p = (HOME / text) if not os.path.isabs(text) else Path(text)

    try:
        resolved = p.resolve()
    except (OSError, RuntimeError):
        raise DesktopError("That path cannot be resolved")

    if resolved != HOME and HOME not in resolved.parents:
        raise DesktopError(
            f"For safety I only work inside your home folder ({HOME}). "
            f"That path points outside it."
        )
    if must_exist and not resolved.exists():
        raise DesktopError(f"'{raw}' does not exist")
    return resolved


def _slug(name: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9._-]+", "-", (name or "").strip()).strip("-.")
    return s or "untitled"


def _rel(p: Path) -> str:
    """Display a path relative to HOME so replies read naturally."""
    try:
        return f"~/{p.relative_to(HOME)}"
    except ValueError:
        return str(p)


def _run(cmd: list[str]) -> None:
    """Launch detached. Fixed argv, never shell=True."""
    if not shutil.which(cmd[0]):
        raise DesktopError(f"'{cmd[0]}' is not installed on this computer")
    subprocess.Popen(
        cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )


# ── Tool implementations ─────────────────────────────────────────────────────

def open_app(app: str, target: str = "") -> dict:
    """Launch an allowlisted application, optionally on a folder or URL."""
    key = (app or "").strip().lower()
    if key not in APP_ALLOWLIST:
        return {
            "success": False,
            "error": f"'{app}' is not an app I can open. Available: "
                     + ", ".join(sorted(set(APP_ALLOWLIST))),
        }

    cmd = list(APP_ALLOWLIST[key])

    if key == "browser":
        url = (target or "").strip() or "https://www.google.com"
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        cmd = ["xdg-open", url]
    elif target:
        cmd.append(str(_safe_path(target, must_exist=True)))

    try:
        _run(cmd)
    except DesktopError as e:
        return {"success": False, "error": str(e)}

    return {
        "success": True,
        "type": "system_action",
        "action": "open_app",
        "message": f"Opened {key}" + (f" on {target}" if target else ""),
    }


def create_folder(name: str, parent: str = "") -> dict:
    """Create a folder inside the home directory."""
    try:
        base = _safe_path(parent, must_exist=True) if parent else HOME
        if not base.is_dir():
            return {"success": False, "error": f"'{parent}' is not a folder"}

        folder = _safe_path(str(base / _slug(name)))
        if folder.exists():
            return {"success": False, "error": f"{_rel(folder)} already exists"}

        folder.mkdir(parents=True)
        return {
            "success": True,
            "type": "system_action",
            "action": "create_folder",
            "path": _rel(folder),
            "message": f"Created {_rel(folder)}",
        }
    except DesktopError as e:
        return {"success": False, "error": str(e)}


def create_project(name: str, project_type: str = "empty",
                   parent: str = "", open_in_editor: bool = True) -> dict:
    """Create a project folder from a small template and open it in VS Code."""
    kind = (project_type or "empty").strip().lower()
    if kind not in PROJECT_TEMPLATES:
        return {
            "success": False,
            "error": f"Unknown project type '{project_type}'. Choose one of: "
                     + ", ".join(PROJECT_TEMPLATES),
        }

    try:
        base = _safe_path(parent, must_exist=True) if parent else (HOME / "Projects")
        base.mkdir(parents=True, exist_ok=True)

        slug = _slug(name)
        root = _safe_path(str(base / slug))
        if root.exists():
            return {"success": False, "error": f"{_rel(root)} already exists"}

        root.mkdir(parents=True)

        created = []
        for filename, template in PROJECT_TEMPLATES[kind].items():
            f = root / filename
            if f.exists():
                continue                      # never overwrite
            f.write_text(template.format(name=name, slug=slug), encoding="utf-8")
            created.append(filename)

        opened = False
        if open_in_editor:
            try:
                _run(["code", str(root)])
                opened = True
            except DesktopError:
                pass                          # folder still created

        return {
            "success": True,
            "type": "system_action",
            "action": "create_project",
            "path": _rel(root),
            "files": created,
            "opened_in_vscode": opened,
            "message": (
                f"Created {kind} project '{name}' at {_rel(root)}"
                + (" and opened it in VS Code" if opened else "")
            ),
        }
    except DesktopError as e:
        return {"success": False, "error": str(e)}


def list_folder(path: str = "") -> dict:
    """List what's inside a folder."""
    try:
        target = _safe_path(path, must_exist=True) if path else HOME
        if not target.is_dir():
            return {"success": False, "error": f"'{path}' is not a folder"}

        entries = sorted(target.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
        items = [
            {"name": e.name, "type": "folder" if e.is_dir() else "file"}
            for e in entries if not e.name.startswith(".")
        ][:60]

        return {"success": True, "path": _rel(target), "count": len(items), "items": items}
    except DesktopError as e:
        return {"success": False, "error": str(e)}


def open_path(path: str) -> dict:
    """Open a file or folder in whatever the system considers its default app."""
    try:
        target = _safe_path(path, must_exist=True)
        _run(["xdg-open", str(target)])
        return {
            "success": True,
            "type": "system_action",
            "action": "open_path",
            "message": f"Opened {_rel(target)}",
        }
    except DesktopError as e:
        return {"success": False, "error": str(e)}


# ── Schemas exposed to the model ─────────────────────────────────────────────

DESKTOP_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "open_app",
            "description": (
                "Open an application on the user's computer. Use for requests like "
                "'open VS Code', 'open my files'. For websites and online services "
                "use open_link instead — that opens on the user's own device, while "
                "this opens on the host computer."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "app": {
                        "type": "string",
                        "enum": sorted(set(APP_ALLOWLIST)),
                        "description": "Which application to open",
                    },
                    "target": {
                        "type": "string",
                        "description": "Optional folder to open in the app, or a URL when app is 'browser'",
                    },
                },
                "required": ["app"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_folder",
            "description": "Create a new folder in the user's home directory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name":   {"type": "string", "description": "Name of the new folder"},
                    "parent": {"type": "string", "description": "Optional parent folder, e.g. 'Documents'"},
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_project",
            "description": (
                "Create a new coding project folder with starter files and open it in "
                "VS Code. Use for 'make a new python project called X', "
                "'create a website project named Y'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "name":         {"type": "string", "description": "Project name"},
                    "project_type": {
                        "type": "string",
                        "enum": sorted(PROJECT_TEMPLATES),
                        "description": "Type of project to scaffold",
                    },
                    "parent":         {"type": "string", "description": "Optional parent folder (defaults to ~/Projects)"},
                    "open_in_editor": {"type": "boolean", "description": "Open in VS Code afterwards (default true)"},
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_folder",
            "description": "List the files and folders inside a folder.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Folder to list (defaults to home)"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "open_path",
            "description": "Open a specific file or folder in its default application.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File or folder path"},
                },
                "required": ["path"],
            },
        },
    },
]

DESKTOP_FUNCTIONS = {
    "open_app":       open_app,
    "create_folder":  create_folder,
    "create_project": create_project,
    "list_folder":    list_folder,
    "open_path":      open_path,
}
