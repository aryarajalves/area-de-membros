import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CertificateModal from './CertificateModal';

describe('CertificateModal Component', () => {
  const mockCertificate = {
    id: 1,
    certificate_code: 'CERT-ABCD1234',
    student_name: 'Ana Maria Silva',
    course_title: 'Formação em Automações',
    workload_hours: 30,
    instructor_name: 'Prof. Roberto',
    issued_at: '2026-10-30T10:00:00Z',
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CertificateModal
        isOpen={false}
        onClose={vi.fn()}
        certificate={mockCertificate}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders certificate details when isOpen is true', () => {
    render(
      <CertificateModal
        isOpen={true}
        onClose={vi.fn()}
        certificate={mockCertificate}
      />
    );

    expect(screen.getByText('Certificado Oficial de Conclusão')).toBeInTheDocument();
    expect(screen.getByTestId('certificate-student-name')).toHaveTextContent('Ana Maria Silva');
    expect(screen.getByTestId('certificate-course-title')).toHaveTextContent('Formação em Automações');
    expect(screen.getByText(/30h/)).toBeInTheDocument();
    expect(screen.getByTestId('certificate-code-display')).toHaveTextContent('CERT-ABCD1234');
    expect(screen.getByTestId('download-certificate-pdf-btn')).toBeInTheDocument();
  });

  it('copies public validation link when clicking copy button', async () => {
    const handleToast = vi.fn();
    const writeTextMock = vi.fn().mockResolvedValue();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <CertificateModal
        isOpen={true}
        onClose={vi.fn()}
        certificate={mockCertificate}
        addToast={handleToast}
      />
    );

    const copyBtn = screen.getByTestId('copy-validation-link-btn');
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('/validar-certificado/CERT-ABCD1234')
    );
  });

  it('calls onClose when clicking close button', () => {
    const handleClose = vi.fn();
    render(
      <CertificateModal
        isOpen={true}
        onClose={handleClose}
        certificate={mockCertificate}
      />
    );

    fireEvent.click(screen.getByTestId('close-certificate-modal-btn'));
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders exact course duration from workload_label when provided (e.g. 1h 40min)', () => {
    render(
      <CertificateModal
        isOpen={true}
        onClose={vi.fn()}
        certificate={{ ...mockCertificate, workload_label: '1h 40min', workload_hours: 2 }}
      />
    );

    expect(screen.getByText('1h 40min')).toBeInTheDocument();
  });
});
