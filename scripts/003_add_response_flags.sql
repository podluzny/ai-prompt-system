-- Add flags column to ai_responses table
ALTER TABLE ai_responses 
ADD COLUMN IF NOT EXISTS flags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for flag filtering
CREATE INDEX IF NOT EXISTS idx_ai_responses_flags ON ai_responses USING GIN(flags);

-- Comment explaining the flags
COMMENT ON COLUMN ai_responses.flags IS 'Array of flags: interesting, needs_attention, error_flag, good_response, bad_response';
