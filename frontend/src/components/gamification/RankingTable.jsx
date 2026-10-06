import React from 'react';
import { Trophy, CheckCircle2, BookOpen, Star, User } from 'lucide-react';
import StudentRpgLevelBadge from '../student-management/StudentRpgLevelBadge';

export default function RankingTable({ students = [] }) {
  if (students.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
        Nenhum aluno pontuou no período selecionado ainda.
      </div>
    );
  }

  return (
    <div
      className="ranking-table-container"
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
      }}
      data-testid="ranking-table-container"
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '14px 18px', width: '70px', textAlign: 'center' }}>Posição</th>
              <th style={{ padding: '14px 18px' }}>Aluno</th>
              <th style={{ padding: '14px 18px' }}>Nível / Insígnia</th>
              <th style={{ padding: '14px 18px', textAlign: 'center' }}>Melhores Soluções</th>
              <th style={{ padding: '14px 18px', textAlign: 'center' }}>Aulas Concluídas</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Pontuação</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const isCurrentUser = student.is_current_user;
              return (
                <tr
                  key={student.user_id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: isCurrentUser ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                    transition: 'background 0.15s ease'
                  }}
                  data-testid={`ranking-row-${student.rank}`}
                >
                  {/* Posição */}
                  <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 800 }}>
                    {student.rank === 1 && <span style={{ color: '#eab308', fontSize: '1.2rem' }}>🥇</span>}
                    {student.rank === 2 && <span style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>🥈</span>}
                    {student.rank === 3 && <span style={{ color: '#d97706', fontSize: '1.2rem' }}>🥉</span>}
                    {student.rank > 3 && (
                      <span style={{ color: isCurrentUser ? '#60a5fa' : '#94a3b8', fontSize: '0.95rem' }}>
                        #{student.rank}
                      </span>
                    )}
                  </td>

                  {/* Aluno (Avatar + Nome) */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {student.avatar_url ? (
                        <img
                          src={student.avatar_url}
                          alt={student.name}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: isCurrentUser ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isCurrentUser ? '#2563eb' : '#334155',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}
                        >
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: isCurrentUser ? '#93c5fd' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{student.name}</span>
                          {isCurrentUser && (
                            <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Você
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Badge & Nível RPG */}
                  <td style={{ padding: '14px 18px', color: '#cbd5e1', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        {student.badge}
                      </span>
                      <StudentRpgLevelBadge
                        totalPoints={student.points}
                        studentId={student.user_id}
                        compact={true}
                      />
                    </div>
                  </td>

                  {/* Soluções */}
                  <td style={{ padding: '14px 18px', textAlign: 'center', color: '#4ade80', fontWeight: 600 }}>
                    {student.solutions_count}
                  </td>

                  {/* Aulas */}
                  <td style={{ padding: '14px 18px', textAlign: 'center', color: '#60a5fa', fontWeight: 600 }}>
                    {student.lessons_completed_count}
                  </td>

                  {/* Pontuação */}
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#facc15' }} data-testid={`student-points-${student.user_id}`}>
                      {student.points.toLocaleString('pt-BR')} pts
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
