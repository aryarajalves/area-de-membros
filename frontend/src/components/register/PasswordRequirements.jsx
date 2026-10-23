import React from 'react';
import { ShieldCheck, Check, Circle } from 'lucide-react';

export default function PasswordRequirements({ rules }) {
  return (
    <div className="password-rules-card" data-testid="password-requirements">
      <div className="rules-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ShieldCheck size={14} color="#60a5fa" />
        <span>Requisitos da senha:</span>
      </div>
      <ul className="rules-list">
        {rules.map((rule, idx) => (
          <li key={idx} className={rule.valid ? 'rule-met' : 'rule-unmet'}>
            <span
              className="rule-bullet"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {rule.valid ? (
                <Check size={12} strokeWidth={3} color="#34d399" />
              ) : (
                <Circle size={8} color="#64748b" />
              )}
            </span>
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
