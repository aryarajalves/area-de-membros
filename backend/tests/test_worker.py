from unittest.mock import patch, MagicMock
from apscheduler.schedulers.base import BaseScheduler
from apscheduler.schedulers.blocking import BlockingScheduler

from app.worker import (
    run_renewal_check_job,
    run_backup_check_job,
    setup_worker_jobs,
    graceful_shutdown,
)


def test_run_renewal_check_job_success():
    """Testa a execução da rotina de verificação de renovações pelo Worker."""
    mock_results = {"warnings_sent": 2, "expired_sent": 1}
    with patch("app.worker.check_and_dispatch_renewal_events", return_value=mock_results) as mock_dispatch:
        res = run_renewal_check_job()
        assert res == mock_results
        mock_dispatch.assert_called_once()


def test_run_renewal_check_job_exception_handling():
    """Testa o tratamento seguro de exceção na rotina de renovação."""
    with patch("app.worker.check_and_dispatch_renewal_events", side_effect=Exception("Falha no DB")):
        res = run_renewal_check_job()
        assert "error" in res
        assert "Falha no DB" in res["error"]


def test_run_backup_check_job_success():
    """Testa a execução da rotina de backup pelo Worker."""
    with patch("app.worker.run_scheduled_backup_job") as mock_backup:
        run_backup_check_job()
        mock_backup.assert_called_once()


def test_run_backup_check_job_exception_handling():
    """Testa se exceção no backup é capturada sem derrubar o worker."""
    with patch("app.worker.run_scheduled_backup_job", side_effect=Exception("S3 timeout")):
        # Não deve lançar exceção
        run_backup_check_job()


def test_setup_worker_jobs_registration():
    """Testa se os jobs de renovação e backup são registrados corretamente no scheduler."""
    mock_scheduler = MagicMock()
    setup_worker_jobs(scheduler_instance=mock_scheduler)

    assert mock_scheduler.add_job.call_count == 2
    # Verifica os IDs dos jobs registrados
    registered_ids = [call.kwargs.get("id") for call in mock_scheduler.add_job.call_args_list]
    assert "worker_renewal_check_job" in registered_ids
    assert "worker_backup_job" in registered_ids


def test_graceful_shutdown():
    """Testa o tratamento de encerramento gracioso do Worker."""
    mock_scheduler = MagicMock()
    mock_scheduler.running = True

    with patch("app.worker.worker_scheduler", mock_scheduler):
        with patch("sys.exit") as mock_exit:
            graceful_shutdown(15, None)
            mock_scheduler.shutdown.assert_called_once_with(wait=False)
            mock_exit.assert_called_once_with(0)
