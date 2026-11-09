import os
import sys
import json
import struct
import re
import subprocess
import zipfile

BASE_DIR = r"C:\laragon\www\FamilyGuard"
PROOFS_DIR = os.path.join(BASE_DIR, "proofs")
PROTOTYPES_DIR = os.path.join(BASE_DIR, "prototypes")
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts", "design")
DESIGN_MD = os.path.join(BASE_DIR, "design.md")
FIGCRAFT_CLI = r"C:\Users\ipan\AppData\Local\Programs\ArtCraft\FigCraft\figcraft-cli.exe"

report = {
    "proofs_audit": {},
    "prototypes_audit": {},
    "scripts_audit": {},
    "reproducibility_audit": {},
    "zero_emoji_audit": {},
    "design_md_audit": {},
    "verdict": "PENDING"
}

# --- 1. PROOFS PNG AUDIT ---
# Expected frame sizes:
# auth: 1440x900 -> 2x = 2880x1800
# dashboard: 1440x900 -> 2x = 2880x1800
# enrollment_modal: 600x500 -> 2x = 1200x1000
# mobile_dashboard: 390x844 -> 2x = 780x1688
# telemetry: 1440x900 -> 2x = 2880x1800

proof_specs = {
    "auth.png": {"frame_w": 1440, "frame_h": 900, "scale": 2, "exp_w": 2880, "exp_h": 1800},
    "dashboard.png": {"frame_w": 1440, "frame_h": 900, "scale": 2, "exp_w": 2880, "exp_h": 1800},
    "enrollment_modal.png": {"frame_w": 600, "frame_h": 500, "scale": 2, "exp_w": 1200, "exp_h": 1000},
    "mobile_dashboard.png": {"frame_w": 390, "frame_h": 844, "scale": 2, "exp_w": 780, "exp_h": 1688},
    "telemetry.png": {"frame_w": 1440, "frame_h": 900, "scale": 2, "exp_w": 2880, "exp_h": 1800}
}

PNG_MAGIC = b"\x89PNG\r\n\x1a\n"

for fname, spec in proof_specs.items():
    fpath = os.path.join(PROOFS_DIR, fname)
    if not os.path.exists(fpath):
        report["proofs_audit"][fname] = {"status": "FAIL", "reason": "Missing file"}
        continue
    
    size = os.path.getsize(fpath)
    with open(fpath, "rb") as f:
        magic = f.read(8)
        if magic != PNG_MAGIC:
            report["proofs_audit"][fname] = {"status": "FAIL", "reason": f"Bad magic: {magic.hex()}"}
            continue
        
        chunks = []
        ihdr = None
        idat_len = 0
        has_iend = False
        
        while True:
            chunk_len_b = f.read(4)
            if not chunk_len_b or len(chunk_len_b) < 4:
                break
            clen = struct.unpack(">I", chunk_len_b)[0]
            ctype = f.read(4).decode("latin-1", errors="ignore")
            cdata = f.read(clen)
            crc = f.read(4)
            chunks.append(ctype)
            if ctype == "IHDR":
                ihdr = struct.unpack(">IIBBBBB", cdata)
            elif ctype == "IDAT":
                idat_len += clen
            elif ctype == "IEND":
                has_iend = True
    
    if not ihdr:
        report["proofs_audit"][fname] = {"status": "FAIL", "reason": "Missing IHDR"}
        continue
    
    w, h, bit_depth, color_type, comp, filt, interlace = ihdr
    dim_match = (w == spec["exp_w"] and h == spec["exp_h"])
    
    report["proofs_audit"][fname] = {
        "status": "PASS" if dim_match and idat_len > 10000 and has_iend else "FAIL",
        "file_size_bytes": size,
        "width": w,
        "height": h,
        "expected_width": spec["exp_w"],
        "expected_height": spec["exp_h"],
        "scale": spec["scale"],
        "bit_depth": bit_depth,
        "color_type": color_type,
        "idat_bytes": idat_len,
        "has_iend": has_iend,
        "chunks": list(dict.fromkeys(chunks))
    }

# --- 2. SCRIPTS DEEP AUDIT ---
svg_path_pattern = re.compile(r"^[MmLlHhVvCcSsQqTtAaZz0-9\s.,-]+$")

for fname in sorted(os.listdir(SCRIPTS_DIR)):
    if not fname.endswith(".json"): continue
    p = os.path.join(SCRIPTS_DIR, fname)
    with open(p, "r", encoding="utf-8") as f:
        try:
            cmds = json.load(f)
        except Exception as e:
            report["scripts_audit"][fname] = {"status": "FAIL", "reason": f"JSON error: {str(e)}"}
            continue
    
    frames = [c for c in cmds if c.get("command") == "frame.create"]
    nodes = [c for c in cmds if c.get("command") == "node.create"]
    vectors = [c for c in cmds if c.get("command") == "vector.create"]
    texts = [c for c in cmds if c.get("command") == "text.create"]
    lines = [c for c in cmds if c.get("command") == "shape.line"]
    
    # Verify vectors
    invalid_vectors = []
    vector_details = []
    for v in vectors:
        pms = v.get("params", {})
        vname = pms.get("name", "unnamed")
        vpath = pms.get("path", "")
        if not vpath or not svg_path_pattern.match(vpath) or len(vpath) < 10:
            invalid_vectors.append(vname)
        else:
            vector_details.append({
                "name": vname,
                "path_len": len(vpath),
                "path_sample": vpath[:40] + "..." if len(vpath) > 40 else vpath
            })
    
    # Check for placeholder / dummy terms in texts or names
    suspicious_terms = ["dummy", "mock", "placeholder", "lorem", "fake", "todo", "sample"]
    found_suspicious = []
    for t in texts:
        tval = t.get("params", {}).get("text", "")
        for s in suspicious_terms:
            if s in tval.lower():
                found_suspicious.append(tval)
    
    report["scripts_audit"][fname] = {
        "status": "PASS" if len(invalid_vectors) == 0 and len(cmds) > 20 and len(vectors) > 0 else "FAIL",
        "total_commands": len(cmds),
        "command_breakdown": {
            "frame.create": len(frames),
            "node.create": len(nodes),
            "vector.create": len(vectors),
            "text.create": len(texts),
            "shape.line": len(lines)
        },
        "frame_dimensions": {
            "width": frames[0].get("params", {}).get("width") if frames else None,
            "height": frames[0].get("params", {}).get("height") if frames else None,
            "name": frames[0].get("params", {}).get("name") if frames else None
        },
        "vector_count": len(vectors),
        "invalid_vectors": invalid_vectors,
        "sample_vectors": vector_details[:4],
        "suspicious_terms_in_text": found_suspicious,
        "sample_ui_texts": [t.get("params", {}).get("text") for t in texts[:5]]
    }

# --- 3. PROTOTYPES AUDIT & ZIP STRUCTURE ---
for fname in sorted(os.listdir(PROTOTYPES_DIR)):
    if not fname.endswith(".figcraft"): continue
    p = os.path.join(PROTOTYPES_DIR, fname)
    size = os.path.getsize(p)
    
    # Verify zip structure
    has_doc_json = False
    doc_node_count = 0
    with zipfile.ZipFile(p, "r") as z:
        namelist = z.namelist()
        if "document.json" in namelist:
            has_doc_json = True
            doc_data = json.loads(z.read("document.json").decode("utf-8"))
            # Count elements
            doc_node_count = len(doc_data.get("children", []))
    
    # Run figcraft-cli info
    proc = subprocess.run([FIGCRAFT_CLI, "info", p, "--json"], capture_output=True, text=True)
    cli_info = json.loads(proc.stdout) if proc.returncode == 0 else {}
    
    report["prototypes_audit"][fname] = {
        "status": "PASS" if proc.returncode == 0 and cli_info.get("nodes", 0) > 20 and has_doc_json else "FAIL",
        "file_size_bytes": size,
        "zip_contents": namelist,
        "cli_total_nodes": cli_info.get("nodes", 0),
        "cli_pages": len(cli_info.get("pages", [])),
        "frames": [
            {"id": f.get("id"), "name": f.get("name"), "w": f.get("width"), "h": f.get("height")}
            for pg in cli_info.get("pages", []) for f in pg.get("frames", [])
        ]
    }

# --- 4. INDEPENDENT RE-EXECUTION / PROVENANCE ---
# Test running all 5 scripts via figcraft-cli run and verify node count parity
repro_results = {}
temp_dir = os.path.join(BASE_DIR, ".agents", "teamwork", "teamwork_auditor_m1")

script_to_proto = {
    "auth_screen.json": "auth.figcraft",
    "dashboard_screen.json": "dashboard.figcraft",
    "enrollment_modal.json": "enrollment_modal.figcraft",
    "mobile_dashboard.json": "mobile_dashboard.figcraft",
    "telemetry_screen.json": "telemetry.figcraft"
}

for sname, pname in script_to_proto.items():
    spath = os.path.join(SCRIPTS_DIR, sname)
    out_proto = os.path.join(temp_dir, f"audit_{pname}")
    out_png = os.path.join(temp_dir, f"audit_{pname.replace('.figcraft', '.png')}")
    
    # 1. Run script -> figcraft
    r1 = subprocess.run([FIGCRAFT_CLI, "run", spath, "--out", out_proto], capture_output=True, text=True)
    if r1.returncode != 0:
        repro_results[sname] = {"status": "FAIL", "reason": f"Run failed: {r1.stderr}"}
        continue
    
    # 2. Inspect generated figcraft
    i1 = subprocess.run([FIGCRAFT_CLI, "info", out_proto, "--json"], capture_output=True, text=True)
    i1_json = json.loads(i1.stdout) if i1.returncode == 0 else {}
    orig_nodes = report["prototypes_audit"][pname]["cli_total_nodes"]
    gen_nodes = i1_json.get("nodes", 0)
    
    # 3. Export to PNG at scale 2
    r2 = subprocess.run([FIGCRAFT_CLI, "export", out_proto, "-o", out_png, "--scale", "2"], capture_output=True, text=True)
    
    # Check dimensions
    if os.path.exists(out_png):
        with open(out_png, "rb") as f:
            f.read(16)
            pw, ph = struct.unpack(">II", f.read(8))
    else:
        pw, ph = 0, 0
    
    proof_name = pname.replace(".figcraft", ".png")
    exp_w = proof_specs[proof_name]["exp_w"]
    exp_h = proof_specs[proof_name]["exp_h"]
    
    repro_results[sname] = {
        "status": "PASS" if gen_nodes == orig_nodes and pw == exp_w and ph == exp_h else "FAIL",
        "script_run_ok": r1.returncode == 0,
        "export_png_ok": r2.returncode == 0,
        "original_nodes": orig_nodes,
        "generated_nodes": gen_nodes,
        "nodes_parity": gen_nodes == orig_nodes,
        "rendered_w": pw,
        "rendered_h": ph,
        "expected_w": exp_w,
        "expected_h": exp_h,
        "dimension_parity": (pw == exp_w and ph == exp_h)
    }

report["reproducibility_audit"] = repro_results

# --- 5. ZERO EMOJI AUDIT (Text and JSON streams only) ---
emoji_pattern = re.compile(
    r"[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U00002B50\U00002B55\U0000FE0F]"
)

# Text files to check
text_targets = [DESIGN_MD]
for d in [SCRIPTS_DIR]:
    for f in os.listdir(d):
        text_targets.append(os.path.join(d, f))

zero_emoji_res = {}
for p in text_targets:
    rel = os.path.relpath(p, BASE_DIR)
    with open(p, "r", encoding="utf-8") as f:
        txt = f.read()
    m = emoji_pattern.findall(txt)
    zero_emoji_res[rel] = {
        "status": "PASS" if len(m) == 0 else "FAIL",
        "count": len(m),
        "matches": [f"U+{ord(x):04X}" for x in m[:5]]
    }

# Also check document.json inside every prototype zip
for f in os.listdir(PROTOTYPES_DIR):
    if not f.endswith(".figcraft"): continue
    rel = os.path.join("prototypes", f, "document.json")
    with zipfile.ZipFile(os.path.join(PROTOTYPES_DIR, f), "r") as z:
        txt = z.read("document.json").decode("utf-8")
    m = emoji_pattern.findall(txt)
    zero_emoji_res[rel] = {
        "status": "PASS" if len(m) == 0 else "FAIL",
        "count": len(m),
        "matches": [f"U+{ord(x):04X}" for x in m[:5]]
    }

report["zero_emoji_audit"] = zero_emoji_res

# --- 6. DESIGN.MD AUDIT ---
with open(DESIGN_MD, "r", encoding="utf-8") as f:
    dmd_text = f.read()

dmd_reqs = {
    "Atmospheric Obsidian (#0B0F19)": "#0B0F19" in dmd_text,
    "Solid Content Card (#111827)": "#111827" in dmd_text,
    "Cobalt Primary Brand (#2563EB)": "#2563EB" in dmd_text,
    "Liquid Glass Platter Specification": "liquid-glass-platter" in dmd_text and "--glass-blur" in dmd_text,
    "WCAG AA Contrast Matrix with calculations": "WCAG AA Contrast Validation Matrix" in dmd_text and "18.30:1" in dmd_text,
    "Zero-Emoji Policy and Vector Icon Registry": "Strict Zero-Emoji Policy" in dmd_text and "Phosphor Icons" in dmd_text,
    "7 Interaction States Defined": all(s in dmd_text for s in ["idle", "hover", "active", "focus-visible", "loading", "error", "disabled"]),
    "Apple Motion Timing (cubic-bezier)": "cubic-bezier(0.16, 1, 0.3, 1)" in dmd_text,
    "Reduced Transparency Fallback": "prefers-reduced-transparency" in dmd_text,
    "Reduced Motion Fallback": "prefers-reduced-motion" in dmd_text
}

report["design_md_audit"] = {
    "status": "PASS" if all(dmd_reqs.values()) else "FAIL",
    "checklist": dmd_reqs,
    "line_count": len(dmd_text.splitlines()),
    "character_count": len(dmd_text)
}

# FINAL VERDICT
all_passes = []
for cat in ["proofs_audit", "scripts_audit", "prototypes_audit", "reproducibility_audit", "zero_emoji_audit", "design_md_audit"]:
    sub = report[cat]
    if isinstance(sub, dict):
        if "status" in sub:
            all_passes.append(sub["status"] == "PASS")
        else:
            for item in sub.values():
                if isinstance(item, dict) and "status" in item:
                    all_passes.append(item["status"] == "PASS")

report["verdict"] = "CLEAN" if all(all_passes) else "INTEGRITY VIOLATION"

with open(os.path.join(temp_dir, "forensic_report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)

print(f"VERDICT: {report['verdict']}")
print(f"Total sub-checks: {len(all_passes)}, Passed: {sum(all_passes)}, Failed: {len(all_passes) - sum(all_passes)}")
