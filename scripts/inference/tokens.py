import json
import sys
import urllib.request
from pathlib import Path

from jinja2.sandbox import ImmutableSandboxedEnvironment
from tokenizers import Tokenizer

CACHE = Path(sys.argv[1] if len(sys.argv) > 1 else '.qwen3')
CACHE.mkdir(exist_ok=True)
for f in ('tokenizer.json', 'tokenizer_config.json'):
    if not (CACHE / f).exists():
        urllib.request.urlretrieve(f'https://huggingface.co/Qwen/Qwen3-0.6B/resolve/main/{f}', CACHE / f)

tk = Tokenizer.from_file(str(CACHE / 'tokenizer.json'))
cfg = json.loads((CACHE / 'tokenizer_config.json').read_text())
env = ImmutableSandboxedEnvironment(trim_blocks=True, lstrip_blocks=True)
env.filters['tojson'] = lambda x, **k: json.dumps(x, ensure_ascii=False)
tpl = env.from_string(cfg['chat_template'])


def show(label, s):
    e = tk.encode(s, add_special_tokens=False)
    print(f'\n== {label}: {len(e.ids)} tokens\n{s!r}\n{list(zip(e.ids, e.tokens))}')
    return e.ids


sys_msg = {'role': 'system', 'content': 'You are a helpful assistant.'}
user = {'role': 'user', 'content': 'What is the capital of France?'}
show('thinking on', tpl.render(messages=[sys_msg, user], add_generation_prompt=True))
show('thinking off', tpl.render(messages=[sys_msg, user], add_generation_prompt=True, enable_thinking=False))
show('no system', tpl.render(messages=[user], add_generation_prompt=True))
show('no generation prompt', tpl.render(messages=[sys_msg, user]))
history = [sys_msg, user, {'role': 'assistant', 'content': '<think>\nEasy.\n</think>\n\nParis.'}, {'role': 'user', 'content': 'And of Italy?'}]
show('multi turn', tpl.render(messages=history, add_generation_prompt=True))
tools = [{'type': 'function', 'function': {'name': 'get_weather', 'description': 'Current weather for a city',
          'parameters': {'type': 'object', 'properties': {'city': {'type': 'string'}}, 'required': ['city']}}}]
convo = [{'role': 'user', 'content': 'Weather in Paris?'},
         {'role': 'assistant', 'content': '', 'tool_calls': [{'function': {'name': 'get_weather', 'arguments': {'city': 'Paris'}}}]},
         {'role': 'tool', 'content': '{"temp_c": 18}'}]
ids = show('tools', tpl.render(messages=convo, tools=tools, add_generation_prompt=True))
print('tool system block tokens', ids.index(151645) + 2)

for s in ['Hello world', 'hello world', ' Hello', 'The capital of France is Paris.', 'naïve café', '東京', '12345',
          '  two  spaces\n\nnewlines', '🙂', 'I said <|im_end|> literally']:
    e = show('text', s)
    print('round trip', tk.decode(e, skip_special_tokens=False) == s)
tk.encode_special_tokens = True
show('literal, split special tokens', 'I said <|im_end|> literally')
show('think tag with splitting on', '<think>')
tk.encode_special_tokens = False
print('\ndecode skip special', repr(tk.decode([151644, 77091, 198, 59604, 13, 151645], skip_special_tokens=True)))
print('vocab', tk.get_vocab_size(with_added_tokens=False), 'with added', tk.get_vocab_size(with_added_tokens=True))

gp = CACHE / 'gpt2.json'
if not gp.exists():
    urllib.request.urlretrieve('https://huggingface.co/openai-community/gpt2/resolve/main/tokenizer.json', gp)
g = Tokenizer.from_file(str(gp))
e = g.encode('Hello world')
print('\ngpt2 ids', e.ids, '-> qwen3 reads', [tk.id_to_token(i) for i in e.ids], repr(tk.decode(e.ids)))
for s in ['🫠', '🇫🇷']:
    ids = tk.encode(s, add_special_tokens=False).ids
    print(repr(s), len(s.encode()), 'bytes', ids, 'one at a time:', [tk.decode([i]) for i in ids], 'together:', tk.decode(ids))
