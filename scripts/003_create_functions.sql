-- Function to increment completed requests
CREATE OR REPLACE FUNCTION increment_completed(test_run_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE test_runs
  SET completed_requests = completed_requests + 1
  WHERE id = test_run_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment failed requests
CREATE OR REPLACE FUNCTION increment_failed(test_run_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE test_runs
  SET failed_requests = failed_requests + 1
  WHERE id = test_run_id;
END;
$$ LANGUAGE plpgsql;
