"""Read the saved state for the app-owned 06:00 retry; never starts a second agent."""
import json
from pathlib import Path

path = Path(__file__).with_name('checkpoint.json')
state = json.loads(path.read_text())
if state['status'] == 'complete':
    print('System design work is complete. Disable the retry; no further work is needed.')
else:
    print(state['objective'])
    print('Latest user correction:', state['latest_user_feedback'])
    print('Continue from canonical files:', state['canonical_content'])
    print('Remaining units:', ', '.join(state['remaining_units']))
    print('Do not duplicate active review agents or overwrite their files.')
    print(state['warning'])
    print(state['resume'])
