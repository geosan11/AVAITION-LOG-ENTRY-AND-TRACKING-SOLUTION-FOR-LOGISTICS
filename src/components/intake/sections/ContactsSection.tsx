import React from "react";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Icon } from "@/components/ui/Icon";
import { InfoHint } from "@/components/ui/InfoHint";
import { IntakeValidationErrors } from "@/lib/validation/intake";

export interface ContactsSectionProps {
  senderName: string;
  setSenderName: (val: string) => void;
  senderPhone: string;
  setSenderPhone: (val: string) => void;
  consigneeName: string;
  consigneeNameSet: (val: string) => void;
  consigneePhone: string;
  setConsigneePhone: (val: string) => void;
  errors: IntakeValidationErrors;
  onBlurField: (field: string) => void;
}

export const ContactsSection: React.FC<ContactsSectionProps> = ({
  senderName,
  setSenderName,
  senderPhone,
  setSenderPhone,
  consigneeName,
  consigneeNameSet,
  consigneePhone,
  setConsigneePhone,
  errors,
  onBlurField,
}) => {
  return (
    <Card
      header={
        <span className="text-sm font-bold text-foreground flex items-center gap-2">
          <Icon name="contacts" size={15} className="text-accent-amber" />
          2. Sender &amp; recipient
          <InfoHint term="recipient" label="Who is the recipient?" />
        </span>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label="Sender's name"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          onBlur={() => onBlurField("senderName")}
          placeholder="e.g. Dangote Oil Refining Co."
          iconLeft="person"
          error={errors.senderName}
        />

        <TextField
          label="Sender's phone"
          value={senderPhone}
          onChange={(e) => setSenderPhone(e.target.value)}
          onBlur={() => onBlurField("senderPhone")}
          placeholder="08012345678"
          iconLeft="call"
          mono
          error={errors.senderPhone}
          hint="We'll text them when it ships"
        />

        <TextField
          label="Recipient's name"
          value={consigneeName}
          onChange={(e) => consigneeNameSet(e.target.value)}
          onBlur={() => onBlurField("consigneeName")}
          placeholder="e.g. John Okoro"
          iconLeft="person"
          error={errors.consigneeName}
        />

        <TextField
          label="Recipient's phone"
          value={consigneePhone}
          onChange={(e) => setConsigneePhone(e.target.value)}
          onBlur={() => onBlurField("consigneePhone")}
          placeholder="08098765432"
          iconLeft="call"
          mono
          error={errors.consigneePhone}
          hint="We'll text the collection PIN here"
        />
      </div>
    </Card>
  );
};
