import React from 'react';

export default function PasswordRequirements({ rules }) {
  return (
    <div className="password-rules-card" data-testid="password-requirements">
      <span className="rules-title">Requisitos da senha:</span>
      <ul className="rules-list">
        {rules.map((rule, idx) => (
          <li key={idx} className={rule.valid ? 'rule-met' : 'rule-unmet'}>
            <span className="rule-bullet">{rule.valid ? '✓' : '○'}</span>
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
