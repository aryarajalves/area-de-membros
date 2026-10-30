import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseCertificateManager from './CourseCertificateManager';
import LessonReleaseSettings from './LessonReleaseSettings';
import * as api from '../../services/certificatesApi';

describe('CourseCertificateManager & LessonReleaseSettings Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when certificate_enabled is false', async () => {
    vi.spyOn(api, 'fetchCertificateStatusApi').mockResolvedValueOnce({
      eligible: false,
      certificate_enabled: false,
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

  it('renders locked progress banner when student is below 100% and has no certificate', async () => {
    vi.spyOn(api, 'fetchCertificateStatusApi').mockResolvedValueOnce({
      eligible: false,
      certificate_enabled: true,
      progress_pct: 40,
      completed_lessons: 4,
      total_lessons: 10,
      certificate: null,
    });

    render(
      <CourseCertificateManager courseId={1} completedCount={4} totalCount={10} isManager={false} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('course-certificate-banner')).toBeInTheDocument();
      expect(screen.getByText('Certificado Oficial de Conclusão em PDF')).toBeInTheDocument();
      expect(screen.getByTestId('locked-certificate-btn')).toBeInTheDocument();
    });
  });

  it('allows superadmin/admin (isManager=true) to preview/issue certificate even below 100%', async () => {
    vi.spyOn(api, 'fetchCertificateStatusApi').mockResolvedValueOnce({
      eligible: false,
      certificate_enabled: true,
      progress_pct: 20,
      completed_lessons: 2,
      total_lessons: 10,
      certificate: null,
    });

    vi.spyOn(api, 'issueCertificateApi').mockResolvedValueOnce({
      id: 99,
      certificate_code: 'CERT-ADMIN777',
      student_name: 'Admin Teste',
      course_title: 'Curso Preview',
      workload_hours: 12,
      issued_at: '2026-10-30T10:00:00Z',
    });

    render(
      <CourseCertificateManager courseId={1} completedCount={2} totalCount={10} isManager={true} />
    );

    await waitFor(() => {
      expect(screen.getByText('Emitir / Visualizar Certificado (PDF)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('claim-certificate-btn'));

    await waitFor(() => {
      expect(api.issueCertificateApi).toHaveBeenCalledWith(1);
      expect(screen.getByTestId('certificate-modal')).toBeInTheDocument();
      expect(screen.getByText('CERT-ADMIN777')).toBeInTheDocument();
    });
  });

  it('renders claim banner when student is eligible and issues certificate on click', async () => {
    vi.spyOn(api, 'fetchCertificateStatusApi').mockResolvedValueOnce({
      eligible: true,
      certificate_enabled: true,
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
      certificate_enabled: true,
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

  it('switches lesson drip content to 7-day guarantee (days_after)', () => {
    const setAvailabilityStatus = vi.fn();
    const setReleaseType = vi.fn();
    const setReleaseDays = vi.fn();
    const setReleaseDate = vi.fn();

    render(
      <LessonReleaseSettings
        availabilityStatus="available"
        setAvailabilityStatus={setAvailabilityStatus}
        releaseType="days_after"
        setReleaseType={setReleaseType}
        releaseDays={7}
        setReleaseDays={setReleaseDays}
        releaseDate=""
        setReleaseDate={setReleaseDate}
      />
    );

    expect(screen.getByTestId('lesson-drip-settings-container')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-drip-days-input')).toHaveValue(7);

    fireEvent.click(screen.getByText('14 dias'));
    expect(setReleaseDays).toHaveBeenCalledWith(14);
  });
});
