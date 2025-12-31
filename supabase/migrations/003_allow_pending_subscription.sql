-- Allow subscriptions to enter a pending state before Razorpay verification
ALTER TABLE subscriptions
    ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('pending', 'active', 'cancelled', 'expired'));
