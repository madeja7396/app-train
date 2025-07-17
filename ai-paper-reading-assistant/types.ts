
export interface Term {
  id: string;
  text: string;
  explanation: string;
  page: number;
  rect: DOMRectReadOnly;
}

export interface Selection {
  text: string;
  rect: DOMRect;
}