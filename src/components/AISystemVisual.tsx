export function AISystemVisual({ system, active = false }: { system: 'ML' | 'DL' | 'RL'; active?: boolean }) {
  if (system === 'ML') {
    return <svg className={'ai-system-visual ml' + (active ? ' active' : '')} viewBox="0 0 84 44" role="img" aria-label="Prediction curve and confidence range"><path className="range" d="M4 32 C19 30 26 25 38 23 S61 8 80 7 L80 19 C61 16 54 25 39 29 S17 38 4 39 Z" /><path className="line" d="M4 35 C19 33 27 27 39 26 S61 13 80 12" /><circle cx="39" cy="26" r="3" /><text x="5" y="10">68%</text></svg>
  }
  if (system === 'DL') {
    return <svg className={'ai-system-visual dl' + (active ? ' active' : '')} viewBox="0 0 84 44" role="img" aria-label="Live pattern scanning heat grid"><g className="heat"><rect x="5" y="5" width="13" height="13" /><rect x="21" y="5" width="13" height="13" /><rect x="37" y="5" width="13" height="13" /><rect x="53" y="5" width="13" height="13" /><rect x="69" y="5" width="10" height="13" /><rect x="5" y="22" width="13" height="13" /><rect x="21" y="22" width="13" height="13" /><rect x="37" y="22" width="13" height="13" /><rect x="53" y="22" width="13" height="13" /><rect x="69" y="22" width="10" height="13" /></g><path className="scan" d="M3 21 H81" /><circle className="target" cx="59" cy="28" r="5" /></svg>
  }
  return <svg className={'ai-system-visual rl' + (active ? ' active' : '')} viewBox="0 0 84 44" role="img" aria-label="Adaptive state and action path"><path className="branch" d="M10 22 H28 M28 22 L45 9 M28 22 L45 35 M45 9 H69 M45 35 H69" /><circle cx="10" cy="22" r="5" /><circle cx="29" cy="22" r="5" /><circle cx="46" cy="9" r="5" /><circle cx="46" cy="35" r="5" /><circle className="chosen" cx="70" cy="9" r="7" /><circle cx="70" cy="35" r="5" /></svg>
}
