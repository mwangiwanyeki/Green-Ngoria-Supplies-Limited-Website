'use client';

/**
 * MFA enrolment + disablement UI, shared between the admin profile and the
 * portal profile. Pass in the caller's profile — the component decides which
 * branch (enrolled → disable flow, or not → setup flow) to render.
 *
 * Extracted from admin-profile.tsx so client-portal users have the same
 * self-service MFA controls without duplicating the ~250-line UI.
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import {
  Check,
  Copy,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useMfaSetup,
  useMfaEnable,
  useMfaDisable,
} from '@/lib/api/hooks/use-auth';

export interface MfaSectionProfile {
  email: string;
  mfaEnabled: boolean;
}

export function MfaSection({ profile }: { profile: MfaSectionProfile }) {
  if (profile.mfaEnabled) return <MfaEnabled />;
  return <MfaSetup email={profile.email} />;
}

function MfaEnabled() {
  const disable = useMfaDisable();
  const [code, setCode] = useState('');
  const [confirming, setConfirming] = useState(false);

  const onDisable = (submitted?: string) => {
    const value = submitted ?? code;
    if (!/^\d{6}$/.test(value)) {
      toast.error('Enter the 6-digit code from your authenticator');
      return;
    }
    if (disable.isPending) return;
    disable.mutate(value, {
      onSuccess: () => {
        toast.success('Two-factor authentication disabled');
        setCode('');
        setConfirming(false);
      },
      onError: (err) => {
        setCode('');
        toast.error(
          err instanceof Error ? err.message : 'Could not disable MFA',
        );
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-500" />
          Two-factor authentication
        </CardTitle>
        <CardDescription>
          Your account is protected with an authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-md border border-brand-500/30 bg-brand-500/5 p-4 text-sm">
          <ShieldCheck className="h-5 w-5 shrink-0 text-brand-500" />
          <p className="text-foreground">
            Two-factor authentication is <strong>active</strong>. You&apos;ll be
            asked for a code from your authenticator app each time you sign in.
          </p>
        </div>

        {!confirming ? (
          <Button
            variant="outline"
            leftIcon={<ShieldAlert className="h-4 w-4" />}
            onClick={() => setConfirming(true)}
          >
            Disable two-factor authentication
          </Button>
        ) : (
          <div className="space-y-3 rounded-md border border-border p-4">
            <p className="text-sm text-muted-foreground">
              Enter a current code from your authenticator app to confirm.
            </p>
            <OtpInput
              value={code}
              onChange={setCode}
              onComplete={(v) => onDisable(v)}
              disabled={disable.isPending}
              error={disable.isError}
              aria-label="MFA disable code"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  loading={disable.isPending}
                  disabled={code.length !== 6 || disable.isPending}
                  onClick={() => onDisable()}
                >
                  Confirm disable
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setConfirming(false);
                    setCode('');
                  }}
                  disabled={disable.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MfaSetup({ email }: { email: string }) {
  const setup = useMfaSetup();
  const enable = useMfaEnable();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const secret = setup.data?.secret;
  const otpauthUrl = setup.data?.otpauthUrl;
  const grouped = useMemo(
    () => (secret ? secret.replace(/(.{4})/g, '$1 ').trim() : ''),
    [secret],
  );

  const start = () => {
    setup.mutate(undefined, {
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : 'Could not start MFA setup',
        ),
    });
  };

  const copySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed — select and copy the code manually');
    }
  };

  const onEnable = (submitted?: string) => {
    const value = submitted ?? code;
    if (!/^\d{6}$/.test(value)) {
      toast.error('Enter the 6-digit code from your authenticator');
      return;
    }
    if (enable.isPending) return;
    enable.mutate(value, {
      onSuccess: () => {
        toast.success('Two-factor authentication enabled');
        setCode('');
      },
      onError: (err) => {
        setCode('');
        toast.error(err instanceof Error ? err.message : 'Invalid code');
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-500" />
          Two-factor authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security with a time-based authenticator app
          (Google Authenticator, 1Password, Authy).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!setup.data ? (
          <>
            <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
              <p>
                You&apos;ll scan a QR code with your authenticator app, then
                enter a 6-digit code to confirm. Two-factor authentication is{' '}
                <strong className="text-foreground">not yet enabled</strong>.
              </p>
            </div>
            <Button
              variant="brand"
              leftIcon={<ShieldCheck className="h-4 w-4" />}
              loading={setup.isPending}
              onClick={start}
            >
              Set up two-factor authentication
            </Button>
          </>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-lg border border-border bg-white p-3">
                  {otpauthUrl && (
                    <QRCodeSVG
                      value={otpauthUrl}
                      size={168}
                      level="M"
                      marginSize={0}
                    />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Scan with your authenticator
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">
                    1. Scan the QR code, or enter the key manually
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Account: {email}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Setup key</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 select-all break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm tracking-wider">
                      {grouped}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Copy setup key"
                      onClick={() => void copySecret()}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-brand-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-5">
              <Label>2. Enter the 6-digit code to confirm</Label>
              <OtpInput
                value={code}
                onChange={setCode}
                onComplete={(v) => onEnable(v)}
                disabled={enable.isPending}
                error={enable.isError}
                aria-label="MFA setup code"
              />
              <p className="text-xs text-muted-foreground">
                It verifies automatically once all six digits are entered.
              </p>
              <Button
                variant="brand"
                loading={enable.isPending}
                disabled={code.length !== 6 || enable.isPending}
                onClick={() => onEnable()}
              >
                Verify &amp; enable
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
