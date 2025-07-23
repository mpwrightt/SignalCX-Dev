"use client";

import { useState, useEffect } from 'react';

export function ClientDate({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    setFormattedDate(new Date(dateString).toLocaleDateString());
  }, [dateString]);

  if (formattedDate === null) {
    return <>{dateString.split('T')[0]}</>;
  }

  return <>{formattedDate}</>;
}
