// src/ui/screens/admin/DebugConsole.tsx
// ─────────────────────────────────────────────────────────────────────────────
// E. CONSOLA DE DEBUG — consola estilo terminal para comandos de QA (/help,
// /spawn_wolf, /give_item, /tp, /set_danger, /stats, /who_online). El comando
// se ejecuta en el servidor (autoritativo) y aquí solo se pinta la salida,
// con historial tipo shell y los últimos logs del anillo tras cada comando.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { TerminalSquare, Loader2 } from 'lucide-react';
import { adminService } from '../../../core/services/adminService';
import type { CommandResult, LogEntry } from '../../../types/admin.types';
import { PageHeader } from '../../components/admin/Spinner';

interface Line { kind: 'input' | 'out' | 'error' | 'log'; text: string }

const QUICK_COMMANDS = ['/help', '/stats', '/who_online', '/spawn_wolf 500 500', '/give_item me Espada de Prueba weapon 1'];

export const DebugConsole = () => {
  const [lines, setLines] = useState<Line[]>([
    { kind: 'out', text: 'Consola de depuración MURIM conectada al backend autoritativo. Escribe /help para ver los comandos.' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  const pushLines = (newLines: Line[]): void => setLines((prev) => [...prev, ...newLines]);

  const run = async (raw: string): Promise<void> => {
    const cmd = raw.trim();
    if (!cmd) return;
    pushLines([{ kind: 'input', text: cmd }]);
    setHistory((h) => [cmd, ...h].slice(0, 50));
    setHistIdx(-1);
    setInput('');
    setRunning(true);
    try {
      const res: CommandResult = await adminService.runCommand(cmd);
      const out: Line[] = [{ kind: res.ok ? 'out' : 'error', text: res.output }];
      if (res.logs && res.logs.length > 0) {
        out.push(...res.logs.map((l: LogEntry) => ({ kind: 'log' as const, text: `[${l.level}] ${l.source}: ${l.message}` })));
      }
      pushLines(out);
    } catch (err) {
      pushLines([{ kind: 'error', text: err instanceof Error ? err.message : String(err) }]);
    } finally {
      setRunning(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') { void run(input); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      if (history[next] !== undefined) { setHistIdx(next); setInput(history[next]); }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = histIdx - 1;
      setHistIdx(Math.max(next, -1));
      setInput(next >= 0 ? (history[next] ?? '') : '');
    }
  };

  const lineCls: Record<Line['kind'], string> = {
    input: 'text-cyan-300',
    out: 'text-emerald-400',
    error: 'text-rose-400',
    log: 'text-stone-500 italic',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consola de Depuración"
        subtitle="Comandos internos de QA ejecutados contra la base de datos autoritativa — nuncaMath.random, siempre determinista"
      />

      {/* Accesos rápidos */}
      <div className="flex flex-wrap gap-2">
        {QUICK_COMMANDS.map((c) => (
          <button key={c} onClick={() => void run(c)}
            className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs font-mono text-stone-300 hover:border-amber-800 hover:text-amber-400 transition-colors cursor-pointer">
            {c}
          </button>
        ))}
      </div>

      {/* Terminal */}
      <div className="bg-[#0a0f0a] border border-stone-800 rounded-xl overflow-hidden shadow-inner" onClick={() => inputRef.current?.focus()}>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-950 border-b border-stone-800">
          <TerminalSquare className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-mono text-stone-400">admin@murim:~$ qa-console</span>
          {running && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 ml-auto" />}
        </div>
        <div className="p-4 h-[420px] overflow-y-auto font-mono text-xs leading-relaxed">
          {lines.map((l, i) => (
            <p key={i} className={`whitespace-pre-wrap break-all ${lineCls[l.kind]}`}>
              {l.kind === 'input' ? <span className="text-stone-500">❯ </span> : null}
              {l.text}
            </p>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border-t border-stone-800 bg-stone-950/60">
          <span className="text-emerald-500 font-mono text-sm">❯</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={running}
            placeholder="/help"
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent text-stone-100 font-mono text-sm focus:outline-none placeholder:text-stone-700 disabled:opacity-50"
          />
          <button
            onClick={() => void run(input)}
            disabled={running || !input.trim()}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/60 disabled:opacity-30 transition-colors cursor-pointer"
          >
            Ejecutar
          </button>
        </div>
      </div>

      <p className="text-[11px] text-stone-600">
        ↑/↓ recorre el historial de comandos · cada ejecución devuelve los 5 últimos logs del servidor.
      </p>
    </div>
  );
};
