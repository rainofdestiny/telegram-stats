// src/types.ts

export interface RawMessage {
  id: number;
  from: string;
  from_id?: string;
  text: string;
  date: string;
  reactions?: Record<string, number> | any[];
  reply_to_message_id?: number;
  media_type?: string;
}

export interface ParsedMessage extends RawMessage {
  fullDateISO: string;
  total: number;
}

export interface Row {
  rank: number;
  from: string;
  text?: string;
  reactions?: number;
  count?: number;
  weeks?: number;
  id?: number | string;
}

export interface Node {
  id: string;
  name: string;
}

export interface Link {
  source: string;
  target: string;
  value: number;
}
