import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseCertificateManager from './CourseCertificateManager';
import * as api from '../../services/certificatesApi';

describe('CourseCertificateManager Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when student is not eligible and has no certificate', async () => {
    vi.spyOn(api, 'fetchCertificateStatusApi').mockResolvedValueOnce({
      eligible: false,
      progress_pct: 40,
      completed_lessons: 4,
      total_lessons: 10,
      certificate: null,
    });

    const { container } = render(
      <CourseCertificateManager courseId={1} completedCount={4} totalCount={10} />
    );

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('renders claim banner when student is eligible and issues certificate on click', async () => {
    vi.spyOn(api, 'fetchCertificateStatusApi').mockResolvedValueOnce({
      eligible: true,
      progress_pct: 100,
      completed_lessons: 10,
      total_lessons: 10,
      certificate: null,
    });

    vi.spyOn(api, 'issueCertificateApi').mockResolvedValueOnce({
      id: 2,
      certificate_code: 'CERT-NOVO999',
      student_name: 'Aluno 100%',
      course_title: 'Curso Completo',
      workload_hours: 15,
      issued_at: '2026-10-30T10:00:00Z',
    });

    render(
      <CourseCertificateManager courseId={1} completedCount={10} totalCount={10} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('course-certificate-banner')).toBeInTheDocument();
      expect(screen.getByText('Parabéns! Você Concluiu 100% do Curso!')).toBeInTheDocument();
    });

    const claimBtn = screen.getByTestId('claim-certificate-btn');
    fireEvent.click(claimBtn);

    await waitFor(() => {
      expect(api.issueCertificateApi).toHaveBeenCalledWith(1);
      expect(screen.getByTestId('certificate-modal')).toBeInTheDocument();
      expect(screen.getByText('CERT-NOVO999')).toBeInTheDocument();
    });
  });

  it('renders "Ver / Baixar Certificado" when certificate is already issued', async () => {
    vi.spyOn(api, 'fetchCertificateStatusApi').mockResolvedValueOnce({
      eligible: true,
      progress_pct: 100,
      completed_lessons: 10,
      total_lessons: 10,
      certificate: {
        id: 3,
        certificate_code: 'CERT-EXISTENTE',
        student_name: 'Aluno Graduado',
        course_title: 'Curso Completo',
        workload_hours: 20,
        issued_at: '2026-10-30T10:00:00Z',
      },
    });

    render(
      <CourseCertificateManager courseId={1} completedCount={10} totalCount={10} />
    );

    await waitFor(() => {
      expect(screen.getByText('Seu Certificado Oficial está Pronto!')).toBeInTheDocument();
      expect(screen.getByText('Ver / Baixar Certificado')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('claim-certificate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('certificate-modal')).toBeInTheDocument();
      expect(screen.getByText('CERT-EXISTENTE')).toBeInTheDocument();
    });
  });
});
