import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CertificatePublicValidationPage from './CertificatePublicValidationPage';
import * as api from '../../services/certificatesApi';

describe('CertificatePublicValidationPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders verified details on successful validation', async () => {
    vi.spyOn(api, 'validatePublicCertificateApi').mockResolvedValueOnce({
      is_valid: true,
      certificate_code: 'CERT-VAL12345',
      student_name: 'Mariana Souza',
      course_title: 'Curso de React Avançado',
      workload_hours: 25,
      instructor_name: 'Prof. Lucas',
      issued_at: '2026-10-30T12:00:00Z',
    });

    render(
      <CertificatePublicValidationPage certificateCode="CERT-VAL12345" />
    );

    expect(screen.getByTestId('validation-loading-spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('validation-success-state')).toBeInTheDocument();
      expect(screen.getByText('CERTIFICADO AUTÊNTICO E VÁLIDO')).toBeInTheDocument();
      expect(screen.getByTestId('validation-student-name')).toHaveTextContent('Mariana Souza');
      expect(screen.getByTestId('validation-course-title')).toHaveTextContent('Curso de React Avançado');
      expect(screen.getByText(/25 horas/)).toBeInTheDocument();
      expect(screen.getByTestId('download-verified-pdf-btn')).toBeInTheDocument();
    });
  });

  it('renders error state when certificate code is not found', async () => {
    vi.spyOn(api, 'validatePublicCertificateApi').mockRejectedValueOnce(
      new Error('Certificado de conclusão não encontrado.')
    );

    render(
      <CertificatePublicValidationPage certificateCode="CERT-INVALIDO" />
    );

    await waitFor(() => {
      expect(screen.getByTestId('validation-error-state')).toBeInTheDocument();
      expect(screen.getByText('Certificado Não Encontrado ou Inválido')).toBeInTheDocument();
      expect(screen.getByText(/CERT-INVALIDO/)).toBeInTheDocument();
    });
  });
});
