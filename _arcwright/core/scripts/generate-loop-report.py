import os
import json
import webbrowser
from datetime import datetime

# Path to templates relative to this script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')

def generate_report(logs, output_dir):
    import hashlib
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    report_tag = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    
    # Add uniqueness to prevent collisions in high-speed loops
    unique_hash = hashlib.md5(str(logs).encode()).hexdigest()[:6]
    report_tag = f"{report_tag}_{unique_hash}"
    
    md_template_path = os.path.join(TEMPLATE_DIR, 'review-loop-report.md')
    html_template_path = os.path.join(TEMPLATE_DIR, 'review-loop-report.html')
    
    if not os.path.exists(md_template_path) or not os.path.exists(html_template_path):
        print(f"Error: Templates not found in {TEMPLATE_DIR}")
        return

    with open(md_template_path, 'r', encoding='utf-8') as f:
        md_template = f.read()
    with open(html_template_path, 'r', encoding='utf-8') as f:
        html_template = f.read()

    # MD Loop Content
    md_loop_content = ''
    for i, loop_log in enumerate(logs):
        md_loop_content += f'## Loop {i+1}\n\n'
        md_loop_content += f'### Findings\n{loop_log.get("findings", "No findings")}\n\n'
        md_loop_content += f'### Applied Fixes\n{loop_log.get("fixes", "No fixes")}\n\n'
        md_loop_content += '---\n\n'

    md_report = md_template.replace('{{timestamp}}', timestamp).replace('{{total_loops}}', str(len(logs))).replace('{{loop_content}}', md_loop_content)
    
    md_output_path = os.path.join(output_dir, f'loop-report-{report_tag}.md')
    with open(md_output_path, 'w', encoding='utf-8') as f:
        f.write(md_report)

    # HTML Loop Content
    loop_navigation = ''.join([f'<li><a href="#loop-{i+1}" style="color: white; text-decoration: none;">Loop {i+1}</a></li>' for i in range(len(logs))])
    
    html_loop_content = ''
    for i, loop_log in enumerate(logs):
        findings = loop_log.get("findings", "No findings").replace('\n', '<br>')
        fixes = loop_log.get("fixes", "No fixes")
        html_loop_content += f'<div id="loop-{i+1}" class="loop-card"><h2>Loop {i+1}</h2><h3>Findings</h3><div>{findings}</div><h3>Fixes Applied</h3><pre>{fixes}</pre></div>'

    html_report = html_template.replace('{{timestamp}}', timestamp).replace('{{total_loops}}', str(len(logs))).replace('<ul id="loop-navigation-list"></ul>', f'<ul id="loop-navigation-list">{loop_navigation}</ul>').replace('{{loop_content}}', html_loop_content)
    
    html_output_path = os.path.join(output_dir, f'loop-report-{report_tag}.html')
    with open(html_output_path, 'w', encoding='utf-8') as f:
        f.write(html_report)
        
    print(f"Reports generated in {output_dir}")
    webbrowser.open(f"file:///{html_output_path}")

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        logs_json = sys.argv[1]
        output_dir = sys.argv[2] if len(sys.argv) > 2 else os.getcwd()
        try:
            logs = json.loads(logs_json)
            generate_report(logs, output_dir)
        except Exception as e:
            print(f"Error: {e}")
