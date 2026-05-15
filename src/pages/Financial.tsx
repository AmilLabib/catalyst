import { useEffect, useMemo, useRef, useState } from "react";
import Anthropic from "@anthropic-ai/sdk";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
// Removed unused Recharts imports
import {
  balanceSheet2024,
  incomeStatement2024,
  cashFlow2024,
  changesInEquity2024,
  formatRupiah,
  checkConsistency,
} from "../data/financials";
import { useDemoMode } from "../context/DemoModeContext";

// Removed unused chart demo data

// Simple Chart of Accounts for journaling
type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense"
  | "distribution";
type StatementTarget =
  | { kind: "bs"; field: keyof typeof balanceSheet2024 }
  | { kind: "is"; field: keyof typeof incomeStatement2024 }
  | { kind: "equity"; field: keyof typeof changesInEquity2024 };

type Account = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  target: StatementTarget;
};

const CHART_OF_ACCOUNTS: Account[] = [
  // Assets
  {
    id: "cash",
    code: "1000",
    name: "Cash",
    type: "asset",
    target: { kind: "bs", field: "cash" },
  },
  {
    id: "ar",
    code: "1100",
    name: "Trade Receivables",
    type: "asset",
    target: { kind: "bs", field: "tradeReceivables" },
  },
  {
    id: "inv",
    code: "1200",
    name: "Inventories",
    type: "asset",
    target: { kind: "bs", field: "inventories" },
  },
  {
    id: "oca",
    code: "1300",
    name: "Other Current Assets",
    type: "asset",
    target: { kind: "bs", field: "otherCurrentAssets" },
  },
  {
    id: "ppe",
    code: "1500",
    name: "Property, Plant & Equipment (net)",
    type: "asset",
    target: { kind: "bs", field: "ppeNet" },
  },
  {
    id: "intang",
    code: "1600",
    name: "Intangible Assets",
    type: "asset",
    target: { kind: "bs", field: "intangible" },
  },
  // Liabilities
  {
    id: "ap",
    code: "2000",
    name: "Trade Payables",
    type: "liability",
    target: { kind: "bs", field: "tradePayables" },
  },
  {
    id: "stb",
    code: "2100",
    name: "Short-term Borrowings",
    type: "liability",
    target: { kind: "bs", field: "shortTermBorrowings" },
  },
  {
    id: "ocl",
    code: "2200",
    name: "Other Current Liabilities",
    type: "liability",
    target: { kind: "bs", field: "otherCurrentLiabilities" },
  },
  {
    id: "ltb",
    code: "2300",
    name: "Long-term Borrowings",
    type: "liability",
    target: { kind: "bs", field: "longTermBorrowings" },
  },
  {
    id: "dtl",
    code: "2400",
    name: "Deferred Tax Liabilities",
    type: "liability",
    target: { kind: "bs", field: "deferredTaxLiabilities" },
  },
  // Equity
  {
    id: "sc",
    code: "3000",
    name: "Share Capital",
    type: "equity",
    target: { kind: "bs", field: "shareCapital" },
  },
  // Revenue & Expenses
  {
    id: "rev",
    code: "4000",
    name: "Revenue",
    type: "revenue",
    target: { kind: "is", field: "revenue" },
  },
  {
    id: "cogs",
    code: "5000",
    name: "Cost of Goods Sold",
    type: "expense",
    target: { kind: "is", field: "cogs" },
  },
  {
    id: "opex",
    code: "5100",
    name: "Operating Expenses",
    type: "expense",
    target: { kind: "is", field: "operatingExpenses" },
  },
  {
    id: "intExp",
    code: "5200",
    name: "Interest Expense",
    type: "expense",
    target: { kind: "is", field: "interestExpense" },
  },
  {
    id: "taxExp",
    code: "5300",
    name: "Tax Expense",
    type: "expense",
    target: { kind: "is", field: "taxExpense" },
  },
  // Distributions (dividends)
  {
    id: "div",
    code: "5400",
    name: "Dividends (Declared/Paid)",
    type: "distribution",
    target: { kind: "equity", field: "dividends" },
  },
];

type JournalLine = {
  id: string;
  side: "debit" | "credit";
  accountId: string;
  amount: number;
};

type JournalEntry = {
  id: string;
  date: string;
  description?: string;
  lines: JournalLine[];
};

function createDemoJournalEntries(todayISO: string): JournalEntry[] {
  // Generate 50 transactions across the last 45 days.
  // We purposely mix:
  // - capital injection
  // - inventory purchases
  // - cash sales + their COGS
  // - operating expenses
  // - interest + tax
  // - occasional dividends
  // to ensure BS/IS/CF all update.

  const baseTs = Date.now();
  const toISO = (daysAgo: number) =>
    new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

  const rand = (seed: number) => {
    // simple deterministic pseudo-rng 0..1
    const x = Math.sin(seed * 999) * 10000;
    return x - Math.floor(x);
  };

  const entries: JournalEntry[] = [];

  // 1) initial capital injection so we have cash
  entries.push({
    id: `demo-${baseTs}-cap`,
    date: toISO(45),
    description: "Owner injects capital",
    lines: [
      { id: "cap1", side: "debit", accountId: "cash", amount: 60_000_000 },
      { id: "cap2", side: "credit", accountId: "sc", amount: 60_000_000 },
    ],
  });

  let i = 0;
  while (entries.length < 50) {
    i += 1;
    const r = rand(i);
    const daysAgo = Math.floor(rand(i + 10) * 45);
    const date = daysAgo === 0 ? todayISO : toISO(daysAgo);

    // amounts (IDR)
    const sales =
      Math.round((2_000_000 + rand(i + 20) * 10_000_000) / 50_000) * 50_000;
    const cogs = Math.round(sales * (0.32 + rand(i + 21) * 0.18));
    const invBuy =
      Math.round((1_000_000 + rand(i + 30) * 6_000_000) / 50_000) * 50_000;
    const opex =
      Math.round((150_000 + rand(i + 31) * 2_000_000) / 50_000) * 50_000;
    const interest =
      Math.round((50_000 + rand(i + 40) * 400_000) / 10_000) * 10_000;
    const tax =
      Math.round((100_000 + rand(i + 41) * 900_000) / 10_000) * 10_000;

    if (r < 0.35) {
      // cash sales
      entries.push({
        id: `demo-${baseTs}-sale-${entries.length}`,
        date,
        description: "Sales (cash)",
        lines: [
          {
            id: `s${entries.length}-1`,
            side: "debit",
            accountId: "cash",
            amount: sales,
          },
          {
            id: `s${entries.length}-2`,
            side: "credit",
            accountId: "rev",
            amount: sales,
          },
        ],
      });
      if (entries.length < 50) {
        // record COGS right after
        entries.push({
          id: `demo-${baseTs}-cogs-${entries.length}`,
          date,
          description: "Record COGS",
          lines: [
            {
              id: `c${entries.length}-1`,
              side: "debit",
              accountId: "cogs",
              amount: cogs,
            },
            {
              id: `c${entries.length}-2`,
              side: "credit",
              accountId: "inv",
              amount: cogs,
            },
          ],
        });
      }
      continue;
    }

    if (r < 0.55) {
      // inventory purchase
      entries.push({
        id: `demo-${baseTs}-inv-${entries.length}`,
        date,
        description: "Purchase inventory (cash)",
        lines: [
          {
            id: `i${entries.length}-1`,
            side: "debit",
            accountId: "inv",
            amount: invBuy,
          },
          {
            id: `i${entries.length}-2`,
            side: "credit",
            accountId: "cash",
            amount: invBuy,
          },
        ],
      });
      continue;
    }

    if (r < 0.82) {
      // operating expenses
      const expenseAccount = r < 0.68 ? "rent" : "opex";
      const desc =
        expenseAccount === "rent" ? "Pay rent" : "Pay operating expense";
      entries.push({
        id: `demo-${baseTs}-opex-${entries.length}`,
        date,
        description: desc,
        lines: [
          {
            id: `o${entries.length}-1`,
            side: "debit",
            accountId: expenseAccount,
            amount: opex,
          },
          {
            id: `o${entries.length}-2`,
            side: "credit",
            accountId: "cash",
            amount: opex,
          },
        ],
      });
      continue;
    }

    if (r < 0.93) {
      // interest or tax
      const takeInterest = r < 0.88;
      entries.push({
        id: `demo-${baseTs}-fin-${entries.length}`,
        date,
        description: takeInterest ? "Pay interest" : "Pay tax",
        lines: [
          {
            id: `f${entries.length}-1`,
            side: "debit",
            accountId: takeInterest ? "intExp" : "taxExp",
            amount: takeInterest ? interest : tax,
          },
          {
            id: `f${entries.length}-2`,
            side: "credit",
            accountId: "cash",
            amount: takeInterest ? interest : tax,
          },
        ],
      });
      continue;
    }

    // dividends (distribution)
    const divAmt =
      Math.round((250_000 + rand(i + 70) * 2_000_000) / 50_000) * 50_000;
    entries.push({
      id: `demo-${baseTs}-div-${entries.length}`,
      date,
      description: "Pay dividends",
      lines: [
        {
          id: `d${entries.length}-1`,
          side: "debit",
          accountId: "div",
          amount: divAmt,
        },
        {
          id: `d${entries.length}-2`,
          side: "credit",
          accountId: "cash",
          amount: divAmt,
        },
      ],
    });
  }

  // show newest first (matches UI expectation)
  return entries.sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
}

// Alerts
type AlertSeverity = "error" | "warning" | "info";
type Alert = {
  severity: AlertSeverity;
  message: string;
  code?: string;
};

function endsWithZeros(n: number, digits = 6) {
  // e.g., 1_000_000 (6 zeros) pattern
  const m = Math.pow(10, digits);
  return n % m === 0;
}

function normalizeLines(lines: JournalLine[]) {
  // Sort by side+account+amount to compare duplicates
  return [...lines]
    .map((l) => ({ side: l.side, accountId: l.accountId, amount: l.amount }))
    .sort((a, b) => {
      if (a.side !== b.side) return a.side < b.side ? -1 : 1;
      if (a.accountId !== b.accountId)
        return a.accountId < b.accountId ? -1 : 1;
      return a.amount - b.amount;
    });
}

function evaluateAlerts(
  entry: { date: string; description?: string; lines: JournalLine[] },
  options: {
    currentAssetsTotal?: number;
    currentCash?: number;
    getAccount?: (id: string | undefined) => Account | undefined;
    existingEntries?: Array<
      Pick<JournalEntry, "date" | "lines" | "description" | "id">
    >;
  } = {},
): Alert[] {
  const alerts: Alert[] = [];
  const {
    currentAssetsTotal = 0,
    currentCash = 0,
    getAccount,
    existingEntries = [],
  } = options;

  const totalDebit = entry.lines
    .filter((l) => l.side === "debit")
    .reduce((s, l) => s + (l.amount || 0), 0);
  const totalCredit = entry.lines
    .filter((l) => l.side === "credit")
    .reduce((s, l) => s + (l.amount || 0), 0);

  // Errors
  if (entry.lines.length === 0) {
    alerts.push({
      severity: "error",
      code: "NO_LINES",
      message: "Journal has no lines.",
    });
  }
  if (totalDebit <= 0 || totalCredit <= 0) {
    alerts.push({
      severity: "error",
      code: "NO_AMOUNTS",
      message: "Debit and credit must be greater than 0.",
    });
  }
  if (Math.abs(totalDebit - totalCredit) > 0.0001) {
    alerts.push({
      severity: "error",
      code: "IMBALANCED",
      message: `Entry not balanced by ${formatRupiah(
        Math.abs(totalDebit - totalCredit),
      )}.`,
    });
  }
  for (const l of entry.lines) {
    if (!l.accountId) {
      alerts.push({
        severity: "error",
        code: "MISSING_ACCOUNT",
        message: "One or more lines have no account selected.",
      });
      break;
    }
    if (!(l.amount > 0)) {
      alerts.push({
        severity: "error",
        code: "INVALID_AMOUNT",
        message: "Amounts must be positive numbers.",
      });
      break;
    }
  }

  // Date checks
  const todayISO = new Date().toISOString().slice(0, 10);
  if (entry.date && entry.date > todayISO) {
    alerts.push({
      severity: "warning",
      code: "FUTURE_DATE",
      message: "Journal date is in the future.",
    });
  }

  // Description
  if (!entry.description || !entry.description.trim()) {
    alerts.push({
      severity: "warning",
      code: "NO_DESC",
      message: "Consider adding a clear description for audit trail.",
    });
  }

  // Unusual side usage
  for (const l of entry.lines) {
    const acc = getAccount ? getAccount(l.accountId) : undefined;
    if (!acc) continue;
    if (acc.type === "revenue" && l.side === "debit") {
      alerts.push({
        severity: "warning",
        code: "REV_DEBIT",
        message: "Revenue debited — is this a return or reversal?",
      });
    }
    if (acc.type === "expense" && l.side === "credit") {
      alerts.push({
        severity: "warning",
        code: "EXP_CREDIT",
        message: "Expense credited — refund or reclassification?",
      });
    }
  }

  // Large transaction heuristic
  const entryTotal = totalDebit; // equals totalCredit if balanced
  if (currentAssetsTotal > 0) {
    const pctAssets = entryTotal / currentAssetsTotal;
    if (pctAssets >= 0.2) {
      alerts.push({
        severity: "warning",
        code: "LARGE_VS_ASSETS",
        message: `Large entry (${(pctAssets * 100).toFixed(
          1,
        )}% of total assets). Review authorization.`,
      });
    }
  }
  if (currentCash > 0) {
    const pctCash = entryTotal / currentCash;
    if (pctCash >= 0.5) {
      alerts.push({
        severity: "warning",
        code: "LARGE_VS_CASH",
        message: `Large entry (${(pctCash * 100).toFixed(
          1,
        )}% of cash balance). Ensure cash availability/approval.`,
      });
    }
  }

  // Round-number pattern
  const largeRoundedCount = entry.lines.filter(
    (l) => l.amount >= 1_000_000 && endsWithZeros(l.amount, 6),
  ).length;
  if (largeRoundedCount >= Math.max(2, Math.ceil(entry.lines.length / 2))) {
    alerts.push({
      severity: "info",
      code: "ROUND_NUMBERS",
      message:
        "Many large round-number amounts — double-check support documents.",
    });
  }

  // Duplicate detection (exact line set and same date)
  const normalized = JSON.stringify(normalizeLines(entry.lines));
  for (const ex of existingEntries) {
    if (!ex.lines || ex.lines.length === 0) continue;
    const n2 = JSON.stringify(normalizeLines(ex.lines));
    if (ex.date === entry.date && n2 === normalized) {
      alerts.push({
        severity: "warning",
        code: "POSSIBLE_DUP",
        message: "Possible duplicate of an existing journal on the same date.",
      });
      break;
    }
  }

  return alerts;
}

// Helpers
function isCashAccount(id?: string) {
  return id === "cash";
}

// Compact currency formatter: Rp 250 M, Rp 1.2 B; falls back to full for < 1M
function formatRpCompact(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const trim = (n: number) => {
    // 10+ shows no decimal, under 10 shows 1 decimal
    const s = (n >= 10 ? n.toFixed(0) : n.toFixed(1)).replace(/\.0$/, "");
    return s;
  };
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${trim(abs / 1_000_000_000)} B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${trim(abs / 1_000_000)} M`;
  }
  return `${sign}${formatRupiah(abs)}`;
}

import { usePageTitle } from "../hooks/usePageTitle";

const getBaseUrl = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  return `${origin}/anthropic`;
};

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY || "API_KEY_ANDA",
  baseURL: getBaseUrl(),
  dangerouslyAllowBrowser: true,
});

export default function Financial() {
  usePageTitle("Financial");
  const { demoRunId } = useDemoMode();
  const [activeTab, setActiveTab] = useState(0);

  // Fixed chart of accounts (CRUD removed)
  const accounts = CHART_OF_ACCOUNTS;

  const findAccount = (id: string | undefined) =>
    accounts.find((a) => a.id === id);

  // Accounts CRUD handlers removed by request.

  // Journal UI state
  const [debitLinesUI, setDebitLinesUI] = useState<
    Array<{ id: string; accountId: string; amount: string }>
  >([{ id: `${Date.now()}-d0`, accountId: "", amount: "" }]);
  const [creditLinesUI, setCreditLinesUI] = useState<
    Array<{ id: string; accountId: string; amount: string }>
  >([{ id: `${Date.now()}-c0`, accountId: "", amount: "" }]);
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [debitFilter, setDebitFilter] = useState("");
  const [creditFilter, setCreditFilter] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [journalPage, setJournalPage] = useState(1);
  const journalPageSize = 10;
  const [showDraftAlerts, setShowDraftAlerts] = useState(false);
  const alertPanelRef = useRef<HTMLDivElement | null>(null);

  // Step-by-step journal wizard (1: header, 2: debit, 3: credit & review)
  const [journalStep, setJournalStep] = useState<1 | 2 | 3>(1);
  // Camera state/refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scan Struk States
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [scanType, setScanType] = useState<"penjualan" | "pembelian" | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showDataModal, setShowDataModal] = useState(false);
  const [scannedData, setScannedData] = useState<{items: {name: string, price: number}[]} | null>(null);

  useEffect(() => {
    const c = checkConsistency();
    // eslint-disable-next-line no-console
    console.log("Financials consistency:", c);
  }, []);

  // Inject dummy journals when demo mode is triggered
  useEffect(() => {
    if (demoRunId <= 0) return;

    const todayISO = new Date().toISOString().slice(0, 10);
    const demoEntries = createDemoJournalEntries(todayISO);
    setEntries(demoEntries);
    setJournalPage(1);

    // Also reset the wizard inputs so the user sees a clean slate
    setDebitLinesUI([{ id: `${Date.now()}-d0`, accountId: "", amount: "" }]);
    setCreditLinesUI([{ id: `${Date.now()}-c0`, accountId: "", amount: "" }]);
    setDescription("");
    setDebitFilter("");
    setCreditFilter("");
    setShowDraftAlerts(false);
    setJournalStep(1);
    setDate(todayISO);
  }, [demoRunId]);

  const journalTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(entries.length / journalPageSize));
  }, [entries.length]);

  const journalPageSafe = Math.min(Math.max(1, journalPage), journalTotalPages);

  const pagedEntries = useMemo(() => {
    const start = (journalPageSafe - 1) * journalPageSize;
    return entries.slice(start, start + journalPageSize);
  }, [entries, journalPageSafe]);

  // Compute statements after journals
  const { bs, is, cfs, equity } = useMemo(() => {
    // Clone base
    const bs = { ...balanceSheet2024 };
    const is = { ...incomeStatement2024 };
    const cfs = { ...cashFlow2024 };
    const equity = { ...changesInEquity2024 };

    // For cash flow classification buckets (we'll compute residual CFO)
    let cfi = 0;
    let cff = 0;

    // Apply each journal entry
    for (const je of entries) {
      // Posting rules by account type
      const post = (acc: Account, side: "debit" | "credit", amt: number) => {
        const signByType: Record<
          AccountType,
          { debit: 1 | -1; credit: 1 | -1 }
        > = {
          asset: { debit: 1, credit: -1 },
          expense: { debit: 1, credit: -1 },
          liability: { debit: -1, credit: 1 },
          equity: { debit: -1, credit: 1 },
          revenue: { debit: -1, credit: 1 },
          distribution: { debit: 1, credit: -1 }, // dividends increase "dividends" line when debited
        };

        const delta = amt * signByType[acc.type][side];
        if (acc.target.kind === "bs") {
          bs[acc.target.field] = (bs[acc.target.field] as number) + delta;
        } else if (acc.target.kind === "is") {
          is[acc.target.field] = (is[acc.target.field] as number) + delta;
        } else if (acc.target.kind === "equity") {
          equity[acc.target.field] =
            (equity[acc.target.field] as number) + delta;
        }
      };

      // Post each line
      let entryCashDelta = 0;
      let investNonCashSum = 0;
      let financeNonCashSum = 0;
      let otherNonCashSum = 0;

      for (const line of je.lines) {
        const acc = findAccount(line.accountId);
        if (!acc) continue;
        post(acc as Account, line.side, line.amount);

        if (isCashAccount(acc?.id)) {
          entryCashDelta += line.side === "debit" ? line.amount : -line.amount;
        } else {
          if (acc?.id === "ppe" || acc?.id === "intang")
            investNonCashSum += Math.abs(line.amount);
          else if (["stb", "ltb", "sc", "div"].includes(acc!.id))
            financeNonCashSum += Math.abs(line.amount);
          else otherNonCashSum += Math.abs(line.amount);
        }
      }

      // Classify cash flow for the entry using simple heuristic
      if (entryCashDelta !== 0) {
        if (
          investNonCashSum > 0 &&
          financeNonCashSum === 0 &&
          otherNonCashSum === 0
        ) {
          cfi += entryCashDelta;
        } else if (
          financeNonCashSum > 0 &&
          investNonCashSum === 0 &&
          otherNonCashSum === 0
        ) {
          cff += entryCashDelta;
        } else {
          // leave for CFO residual
        }
      }
    }

    // Recompute derived totals
    is.grossProfit = is.revenue - is.cogs;
    is.ebit = is.grossProfit - is.operatingExpenses;
    is.profitBeforeTax = is.ebit - is.interestExpense;
    is.netIncome = is.profitBeforeTax - is.taxExpense;

    equity.netIncome = is.netIncome;
    equity.closingRetainedEarnings =
      equity.openingRetainedEarnings +
      equity.netIncome -
      equity.dividends +
      (equity.otherAdjustments ?? 0);

    bs.totalAssets =
      bs.cash +
      bs.tradeReceivables +
      bs.inventories +
      bs.otherCurrentAssets +
      bs.ppeNet +
      bs.intangible;
    // Keep retained earnings aligned with changes in equity
    bs.retainedEarnings = equity.closingRetainedEarnings;
    bs.totalLiabilities =
      bs.tradePayables +
      bs.shortTermBorrowings +
      bs.otherCurrentLiabilities +
      bs.longTermBorrowings +
      bs.deferredTaxLiabilities;
    bs.totalEquity = bs.shareCapital + bs.retainedEarnings;

    // Cash flow reconciliation
    cfs.closingCash = bs.cash;
    cfs.netChangeInCash = cfs.closingCash - cfs.openingCash;
    cfs.cashFromInvesting = cfi;
    cfs.cashFromFinancing = cff;
    cfs.cashFromOperations =
      cfs.netChangeInCash - cfs.cashFromInvesting - cfs.cashFromFinancing;

    return { bs, is, cfs, equity };
  }, [entries, accounts]);

  // Build draft journal entry from UI for alerting
  const draftEntry = useMemo(() => {
    const debitLines: JournalLine[] = debitLinesUI
      .filter((l) => l.accountId && Number(l.amount) > 0)
      .map((l) => ({
        id: l.id,
        side: "debit" as const,
        accountId: l.accountId,
        amount: Number(l.amount),
      }));
    const creditLines: JournalLine[] = creditLinesUI
      .filter((l) => l.accountId && Number(l.amount) > 0)
      .map((l) => ({
        id: l.id,
        side: "credit" as const,
        accountId: l.accountId,
        amount: Number(l.amount),
      }));
    return { date, description, lines: [...debitLines, ...creditLines] };
  }, [debitLinesUI, creditLinesUI, date, description]);

  // Draft alerts
  const draftAlerts = useMemo(() => {
    return evaluateAlerts(draftEntry, {
      currentAssetsTotal: bs.totalAssets,
      currentCash: bs.cash,
      getAccount: findAccount,
      existingEntries: entries,
    });
  }, [draftEntry, bs.totalAssets, bs.cash, entries, findAccount]);

  const draftHasErrors = draftAlerts.some((a) => a.severity === "error");

  // Compute alerts for posted entries (for display)
  const entryAlertsMap = useMemo(() => {
    const map = new Map<string, Alert[]>();
    for (const e of entries) {
      map.set(
        e.id,
        evaluateAlerts(e, {
          currentAssetsTotal: bs.totalAssets,
          currentCash: bs.cash,
          getAccount: findAccount,
          existingEntries: entries.filter((x) => x.id !== e.id),
        }),
      );
    }
    return map;
  }, [entries, bs.totalAssets, bs.cash, findAccount]);

  // Post button click handler: show errors on click if any, else post
  const handlePostClick = () => {
    if (draftAlerts.length > 0 && draftHasErrors) {
      setShowDraftAlerts(true);
      // Smooth scroll to alerts panel for visibility
      setTimeout(() => {
        alertPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
      return;
    }
    // If no errors, proceed to add journal (it still has internal guardrails)
    addJournal();
    // Hide alerts after successful post
    setShowDraftAlerts(false);
  };

  const addJournal = () => {
    // Build lines from UI
    const debitLines: JournalLine[] = debitLinesUI
      .filter((l) => l.accountId && Number(l.amount) > 0)
      .map((l) => ({
        id: l.id,
        side: "debit" as const,
        accountId: l.accountId,
        amount: Number(l.amount),
      }));
    const creditLines: JournalLine[] = creditLinesUI
      .filter((l) => l.accountId && Number(l.amount) > 0)
      .map((l) => ({
        id: l.id,
        side: "credit" as const,
        accountId: l.accountId,
        amount: Number(l.amount),
      }));

    const totalDebit = debitLines.reduce((s, l) => s + l.amount, 0);
    const totalCredit = creditLines.reduce((s, l) => s + l.amount, 0);
    if (totalDebit <= 0 || totalCredit <= 0) return;
    if (Math.abs(totalDebit - totalCredit) > 0.0001) return; // must balance

    const entry: JournalEntry = {
      id: `${Date.now()}`,
      date,
      description: description?.trim() || undefined,
      lines: [...debitLines, ...creditLines],
    };
    setEntries((prev) => [entry, ...prev]);
    // Reset UI lines but keep filters
    setDebitLinesUI([{ id: `${Date.now()}-d0`, accountId: "", amount: "" }]);
    setCreditLinesUI([{ id: `${Date.now()}-c0`, accountId: "", amount: "" }]);
    setDescription("");
  };

  // Camera controls
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOn(true);
      setCameraError(null);
    } catch (err: any) {
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access."
          : err?.message || "Unable to access camera.",
      );
    }
  };

  const stopCamera = () => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;
    if (videoRef.current) {
      (videoRef.current as any).srcObject = null;
    }
    setIsCameraOn(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    // Compress image to JPEG format to avoid payload too large errors
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhotoDataUrl(dataUrl);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCameraModal = (type: "penjualan" | "pembelian") => {
    setScanType(type);
    setShowCameraModal(true);
    setPhotoDataUrl(null);
    setAnalysisError(null);
    startCamera();
  };

  const closeCameraModal = () => {
    setShowCameraModal(false);
    stopCamera();
    setPhotoDataUrl(null);
    setScanType(null);
    setAnalysisError(null);
  };

  const retakePhoto = () => {
    setPhotoDataUrl(null);
    setAnalysisError(null);
  };

  const analyzePhoto = async () => {
    if (!photoDataUrl) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const base64Data = photoDataUrl.split(',')[1];
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Data
                }
              },
              {
                type: "text",
                text: `Anda adalah asisten ekstraksi data yang sangat akurat. Tugas Anda adalah mengekstrak teks HANYA dari barang yang benar-benar tercetak di gambar struk ini.
ATURAN SANGAT KETAT:
1. HANYA ekstrak nama barang dan harga yang TERLIHAT JELAS di gambar.
2. DILARANG KERAS menebak (hallucinate), mengarang, atau menambahkan barang yang tidak ada di struk.
3. Jika gambar buram atau teks tidak terbaca, LEWATI barang tersebut atau kembalikan array kosong {"items": []}.
4. JANGAN PERNAH mengembalikan data contoh di bawah ini.

Format output (hanya kembalikan JSON murni, tanpa teks lain):
{"items": [{"name": "contoh nama produk asli di struk", "price": 50000}]}`
              }
            ]
          }
        ]
      });

      const textBlock = response.content.find(c => c.type === 'text');
      let text = textBlock && textBlock.type === 'text' ? textBlock.text : "{}";
      
      // Clean up potential markdown formatting
      text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      // Extract just the JSON object
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.slice(firstBrace, lastBrace + 1);
      } else {
        text = '{"items": []}';
      }

      const parsed = JSON.parse(text);
      setScannedData(parsed);
      setShowCameraModal(false);
      stopCamera();
      setShowDataModal(true);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err?.message || "Gagal menganalisis gambar.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateScannedItem = (index: number, field: 'name' | 'price', value: string) => {
    if (!scannedData) return;
    const newItems = [...scannedData.items];
    if (field === 'name') newItems[index].name = value;
    else newItems[index].price = Number(value);
    setScannedData({ items: newItems });
  };

  const removeScannedItem = (index: number) => {
    if (!scannedData) return;
    const newItems = scannedData.items.filter((_, i) => i !== index);
    setScannedData({ items: newItems });
  };

  const addScannedItem = () => {
    if (!scannedData) return;
    setScannedData({ items: [...scannedData.items, { name: "", price: 0 }] });
  };

  const submitScannedData = () => {
    if (!scannedData || !scanType) return;
    const total = scannedData.items.reduce((sum, item) => sum + item.price, 0);
    
    const newEntry: JournalEntry = {
      id: `${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      description: `Scan Struk ${scanType === "penjualan" ? "Penjualan" : "Pembelian"}`,
      lines: scanType === "penjualan" 
        ? [
            { id: `${Date.now()}-1`, side: "debit", accountId: "cash", amount: total },
            { id: `${Date.now()}-2`, side: "credit", accountId: "rev", amount: total }
          ]
        : [
            { id: `${Date.now()}-1`, side: "debit", accountId: "inv", amount: total },
            { id: `${Date.now()}-2`, side: "credit", accountId: "cash", amount: total }
          ]
    };

    setEntries(prev => [newEntry, ...prev]);
    setShowDataModal(false);
    setScannedData(null);
    setScanType(null);
  };

  const removeEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  const filteredDebit = accounts.filter((a) =>
    (a.code + " " + a.name).toLowerCase().includes(debitFilter.toLowerCase()),
  );
  const filteredCredit = accounts.filter((a) =>
    (a.code + " " + a.name).toLowerCase().includes(creditFilter.toLowerCase()),
  );

  const totalDebitUI = debitLinesUI.reduce(
    (s, l) => s + (Number(l.amount) || 0),
    0,
  );
  const totalCreditUI = creditLinesUI.reduce(
    (s, l) => s + (Number(l.amount) || 0),
    0,
  );
  const diffUI = Math.abs(totalDebitUI - totalCreditUI);
  const hasAnyDebit = debitLinesUI.some(
    (l) => l.accountId && Number(l.amount) > 0,
  );
  const hasAnyCredit = creditLinesUI.some(
    (l) => l.accountId && Number(l.amount) > 0,
  );
  const isBalanced = totalDebitUI > 0 && totalCreditUI > 0 && diffUI < 0.0001;

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      <div className="max-w-[80rem] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <p className="text-sm text-gray-600 mb-6 mt-1">
          This page provides a concise overview of financial performance, key
          metrics, and reports to help companies monitor revenue, cash flow, and
          profitability at a glance.
        </p>

        {/* Cards */}
        <main className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md min-w-0 card-hover">
            <p className="text-lg">Total Revenue</p>
            <h3 className="text-4xl font-extrabold text-primary mt-4">
              {formatRpCompact(is.revenue)}
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md min-w-0 card-hover">
            <p className="text-lg">Net Profit</p>
            <h3 className="text-4xl font-extrabold text-primary mt-4">
              {formatRpCompact(is.netIncome)}
            </h3>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md min-w-0 card-hover">
            <p className="text-lg">Net Change in Cash</p>
            <h3 className="text-4xl font-extrabold text-primary mt-4">
              {formatRpCompact(cfs.netChangeInCash)}
            </h3>
          </div>

          {/* Asset Mix Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-md md:col-span-1 min-w-0 card-hover">
            <div className="flex items-center justify-between">
              <p className="text-lg">Asset Mix</p>
              <span className="text-xs text-gray-500">
                as of {new Date().toISOString().slice(0, 10)}
              </span>
            </div>
            <div className="h-64 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Cash", value: bs.cash },
                      { name: "Receivables", value: bs.tradeReceivables },
                      { name: "Inventories", value: bs.inventories },
                      {
                        name: "Other Current Assets",
                        value: bs.otherCurrentAssets,
                      },
                      { name: "PPE (net)", value: bs.ppeNet },
                      { name: "Intangible", value: bs.intangible },
                    ].filter((d) => (d.value as number) > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {[
                      "#486071", // brand_mid1
                      "#778d9b", // brand_mid2
                      "#9cb2c1", // brand_mid3
                      "#e1ecf3", // brand_light
                      "#012a3d", // brand_dark
                      "#486071", // repeat mid1 if needed
                    ].map((color: string, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      formatRpCompact(Number(value))
                    }
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scan Struk Card */}
          <div className="bg-white rounded-2xl p-6 shadow-md md:col-span-1 min-w-0 card-hover md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <p className="text-lg">Scan Struk</p>
                <p className="text-xs text-gray-500">
                  Scan struk belanja/penjualan untuk mencatat jurnal secara otomatis
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                type="button"
                onClick={() => openCameraModal("penjualan")}
                className="px-4 py-2.5 rounded-lg bg-primary text-white flex-1 font-medium shadow text-sm"
              >
                Penjualan
              </button>
              <button
                type="button"
                onClick={() => openCameraModal("pembelian")}
                className="px-4 py-2.5 rounded-lg border border-primary text-primary flex-1 font-medium shadow text-sm"
              >
                Pembelian
              </button>
            </div>
            {/* Hidden canvas used for snapshots */}
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>

          {showCameraModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-lg">
                    Scan Struk {scanType === "penjualan" ? "Penjualan" : "Pembelian"}
                  </h3>
                  <button onClick={closeCameraModal} className="text-gray-500 hover:text-gray-800">
                    Tutup
                  </button>
                </div>
                <div className="p-4 bg-gray-50">
                  {!photoDataUrl ? (
                    <div className="relative">
                      <div className="w-full bg-black rounded-md overflow-hidden aspect-[3/4] sm:aspect-video flex items-center justify-center relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {cameraError && (
                          <div className="absolute top-4 left-4 right-4 border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded text-xs z-10">
                            {cameraError}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-6 py-3 rounded-full bg-primary text-white font-medium shadow-md flex items-center gap-2 disabled:opacity-50"
                          disabled={!isCameraOn}
                        >
                          📸 Ambil Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex flex-col items-center">
                       <div className="w-full bg-gray-200 rounded-md overflow-hidden aspect-[3/4] sm:aspect-video flex items-center justify-center">
                         <img src={photoDataUrl} alt="Captured" className="w-full h-full object-contain" />
                       </div>
                       {analysisError && (
                         <div className="mt-4 border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded text-sm w-full text-center">
                           {analysisError}
                         </div>
                       )}
                       <div className="mt-4 flex justify-center gap-3 w-full">
                         <button
                           type="button"
                           onClick={retakePhoto}
                           disabled={isAnalyzing}
                           className="px-4 py-2 rounded-md border border-gray-300 font-medium bg-white disabled:opacity-50"
                         >
                           Ulangi
                         </button>
                         <button
                           type="button"
                           onClick={analyzePhoto}
                           disabled={isAnalyzing}
                           className="px-6 py-2 rounded-md bg-primary text-white font-medium flex items-center justify-center gap-2 disabled:opacity-70 transition-all min-w-[160px]"
                         >
                           {isAnalyzing && (
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                           )}
                           {isAnalyzing ? "Menganalisis..." : "Analisis Struk"}
                         </button>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showDataModal && scannedData && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Konfirmasi Data Struk</h3>
                  <button onClick={() => setShowDataModal(false)} className="text-gray-500 hover:text-gray-800">
                    Tutup
                  </button>
                </div>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-4">
                     {scannedData.items.map((item, index) => (
                       <div key={index} className="flex gap-2 items-center">
                         <input 
                           value={item.name} 
                           onChange={e => updateScannedItem(index, 'name', e.target.value)} 
                           className="border rounded p-2 flex-1" 
                           placeholder="Nama Barang"
                         />
                         <input 
                           type="number"
                           value={item.price} 
                           onChange={e => updateScannedItem(index, 'price', e.target.value)} 
                           className="border rounded p-2 w-32" 
                           placeholder="Harga"
                         />
                         <button onClick={() => removeScannedItem(index)} className="text-red-500 p-2 font-bold">✕</button>
                       </div>
                     ))}
                     <button onClick={addScannedItem} className="text-primary text-sm font-medium">+ Tambah Barang</button>
                     <div className="pt-4 border-t mt-4 flex justify-between font-bold">
                       <span>Total</span>
                       <span>{formatRupiah(scannedData.items.reduce((s, i) => s + Number(i.price), 0))}</span>
                     </div>
                  </div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                   <button
                     type="button"
                     onClick={submitScannedData}
                     className="px-6 py-2 rounded-md bg-primary text-white font-medium shadow-sm"
                   >
                     Input Jurnal
                   </button>
                </div>
              </div>
            </div>
          )}

          {/* Journal Entry UI */}
          <section className="bg-white rounded-2xl p-6 shadow-md mb-6 md:col-span-3 min-w-0">
            <h2 className="text-xl font-semibold mb-4">Journal Entry</h2>

            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              {[1, 2, 3].map((s) => {
                const step = s as 1 | 2 | 3;
                const active = journalStep === step;
                const disabled =
                  (step === 2 && !date) || (step === 3 && !hasAnyDebit);
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => !disabled && setJournalStep(step)}
                    disabled={disabled}
                    className={
                      active
                        ? "px-3 py-1.5 rounded-full bg-primary text-white"
                        : "px-3 py-1.5 rounded-full border text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    }
                  >
                    Step {step}
                  </button>
                );
              })}
            </div>
            {/* Draft Alerts Panel */}
            {showDraftAlerts && draftAlerts.length > 0 && (
              <div ref={alertPanelRef} className="mb-4 space-y-2">
                {draftAlerts.map((a, idx) => (
                  <div
                    key={idx}
                    className={
                      a.severity === "error"
                        ? "border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded"
                        : a.severity === "warning"
                          ? "border border-yellow-200 bg-yellow-50 text-yellow-800 px-3 py-2 rounded"
                          : "border border-brand_mid3 bg-brand_light text-primary px-3 py-2 rounded"
                    }
                  >
                    {a.message}
                  </div>
                ))}
              </div>
            )}
            {journalStep === 1 && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    className="mt-1 w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>
            )}

            {journalStep === 2 && (
              <div>
                <label className="text-sm text-gray-600">Debit Account</label>
                <input
                  type="text"
                  value={debitFilter}
                  onChange={(e) => setDebitFilter(e.target.value)}
                  placeholder="Search account..."
                  className="mt-1 w-full border rounded-md px-3 py-2"
                />
                <div className="mt-2 space-y-2">
                  {debitLinesUI.map((row) => (
                    <div key={row.id} className="flex flex-wrap gap-2">
                      <select
                        value={row.accountId}
                        onChange={(e) =>
                          setDebitLinesUI((prev) =>
                            prev.map((r) =>
                              r.id === row.id
                                ? { ...r, accountId: e.target.value }
                                : r,
                            ),
                          )
                        }
                        className="min-w-0 flex-1 border rounded-md px-3 py-2"
                      >
                        <option value="">Select debit account</option>
                        {filteredDebit.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} — {a.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={row.amount}
                        onChange={(e) =>
                          setDebitLinesUI((prev) =>
                            prev.map((r) =>
                              r.id === row.id
                                ? { ...r, amount: e.target.value }
                                : r,
                            ),
                          )
                        }
                        placeholder="Amount"
                        className="w-36 sm:w-40 border rounded-md px-3 py-2"
                      />
                      {debitLinesUI.length > 1 && (
                        <button
                          type="button"
                          className="px-2 text-red-600 whitespace-nowrap"
                          onClick={() =>
                            setDebitLinesUI((prev) =>
                              prev.filter((r) => r.id !== row.id),
                            )
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setDebitLinesUI((prev) => [
                        ...prev,
                        {
                          id: `${Date.now()}-d${prev.length}`,
                          accountId: "",
                          amount: "",
                        },
                      ])
                    }
                    className="text-primary text-sm"
                  >
                    + Add debit line
                  </button>
                </div>
              </div>
            )}

            {journalStep === 3 && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">
                    Credit Account
                  </label>
                  <input
                    type="text"
                    value={creditFilter}
                    onChange={(e) => setCreditFilter(e.target.value)}
                    placeholder="Search account..."
                    className="mt-1 w-full border rounded-md px-3 py-2"
                  />
                  <div className="mt-2 space-y-2">
                    {creditLinesUI.map((row) => (
                      <div key={row.id} className="flex flex-wrap gap-2">
                        <select
                          value={row.accountId}
                          onChange={(e) =>
                            setCreditLinesUI((prev) =>
                              prev.map((r) =>
                                r.id === row.id
                                  ? { ...r, accountId: e.target.value }
                                  : r,
                              ),
                            )
                          }
                          className="min-w-0 flex-1 border rounded-md px-3 py-2"
                        >
                          <option value="">Select credit account</option>
                          {filteredCredit.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} — {a.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={row.amount}
                          onChange={(e) =>
                            setCreditLinesUI((prev) =>
                              prev.map((r) =>
                                r.id === row.id
                                  ? { ...r, amount: e.target.value }
                                  : r,
                              ),
                            )
                          }
                          placeholder="Amount"
                          className="w-36 sm:w-40 border rounded-md px-3 py-2"
                        />
                        {creditLinesUI.length > 1 && (
                          <button
                            type="button"
                            className="px-2 text-red-600 whitespace-nowrap"
                            onClick={() =>
                              setCreditLinesUI((prev) =>
                                prev.filter((r) => r.id !== row.id),
                              )
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setCreditLinesUI((prev) => [
                          ...prev,
                          {
                            id: `${Date.now()}-c${prev.length}`,
                            accountId: "",
                            amount: "",
                          },
                        ])
                      }
                      className="text-primary text-sm"
                    >
                      + Add credit line
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Review</p>
                  <div className="mt-2 rounded-xl border bg-gray-50 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Total Debit</span>
                      <span className="font-semibold">
                        {formatRupiah(totalDebitUI)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span>Total Credit</span>
                      <span className="font-semibold">
                        {formatRupiah(totalCreditUI)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span>Difference</span>
                      <span
                        className={
                          isBalanced
                            ? "font-semibold text-emerald-700"
                            : "font-semibold text-red-700"
                        }
                      >
                        {formatRupiah(diffUI)}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      {isBalanced
                        ? "Balanced. You can post this journal."
                        : "Not balanced yet. Make sure debit equals credit."}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-3 flex-wrap items-center">
              <button
                type="button"
                onClick={() =>
                  setJournalStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3)))
                }
                disabled={journalStep === 1}
                className="border px-4 py-2 rounded-md disabled:opacity-60"
              >
                Back
              </button>

              {journalStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setJournalStep((s) => (s + 1) as 1 | 2 | 3)}
                  disabled={
                    (journalStep === 1 && !date) ||
                    (journalStep === 2 && !hasAnyDebit)
                  }
                  className="bg-primary text-white px-4 py-2 rounded-md disabled:opacity-60"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handlePostClick}
                  disabled={!hasAnyDebit || !hasAnyCredit || !isBalanced}
                  className="bg-primary text-white px-4 py-2 rounded-md disabled:opacity-60"
                >
                  Post Journal
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setDebitLinesUI([
                    { id: `${Date.now()}-d0`, accountId: "", amount: "" },
                  ]);
                  setCreditLinesUI([
                    { id: `${Date.now()}-c0`, accountId: "", amount: "" },
                  ]);
                  setDescription("");
                  setDebitFilter("");
                  setCreditFilter("");
                  setShowDraftAlerts(false);
                  setJournalStep(1);
                }}
                className="border px-4 py-2 rounded-md"
              >
                Reset
              </button>
            </div>

            {entries.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Journal Entries</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Description</th>
                        <th className="py-2 pr-4">Lines</th>
                        <th className="py-2 pr-4">Alerts</th>
                        <th className="py-2 pr-4">Total</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedEntries.map((e) => {
                        const total = e.lines.reduce(
                          (s, l) => s + (l.side === "debit" ? l.amount : 0),
                          0,
                        );
                        const alerts = entryAlertsMap.get(e.id) || [];
                        const errCount = alerts.filter(
                          (a) => a.severity === "error",
                        ).length;
                        const warnCount = alerts.filter(
                          (a) => a.severity === "warning",
                        ).length;
                        const infoCount = alerts.filter(
                          (a) => a.severity === "info",
                        ).length;
                        return (
                          <tr key={e.id} className="border-t align-top">
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {e.date}
                            </td>
                            <td className="py-2 pr-4">
                              {e.description || "-"}
                            </td>
                            <td className="py-2 pr-4">
                              <div className="space-y-1">
                                {e.lines.map((l) => {
                                  const a = findAccount(l.accountId);
                                  return (
                                    <div
                                      key={l.id}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="whitespace-nowrap text-gray-600">
                                        {l.side === "debit" ? "Dr" : "Cr"}
                                      </span>
                                      <span className="flex-1 min-w-0 truncate">
                                        {a
                                          ? `${a.code} — ${a.name}`
                                          : l.accountId}
                                      </span>
                                      <span className="whitespace-nowrap">
                                        {formatRupiah(l.amount)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-2 pr-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {errCount > 0 && (
                                  <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700 border border-red-200">
                                    {errCount} error{errCount > 1 ? "s" : ""}
                                  </span>
                                )}
                                {warnCount > 0 && (
                                  <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 border border-yellow-200">
                                    {warnCount} warning
                                    {warnCount > 1 ? "s" : ""}
                                  </span>
                                )}
                                {infoCount > 0 && (
                                  <span className="px-2 py-0.5 text-xs rounded bg-brand_light text-primary border border-brand_mid3">
                                    {infoCount} info
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 pr-4">{formatRupiah(total)}</td>
                            <td className="py-2">
                              <button
                                onClick={() => removeEntry(e.id)}
                                className="text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-gray-600">
                    Showing {(journalPageSafe - 1) * journalPageSize + 1}–
                    {Math.min(
                      journalPageSafe * journalPageSize,
                      entries.length,
                    )}{" "}
                    of {entries.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setJournalPage(1)}
                      disabled={journalPageSafe === 1}
                      className="border px-3 py-1.5 rounded disabled:opacity-50"
                    >
                      First
                    </button>
                    <button
                      type="button"
                      onClick={() => setJournalPage((p) => Math.max(1, p - 1))}
                      disabled={journalPageSafe === 1}
                      className="border px-3 py-1.5 rounded disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-sm text-gray-700 px-2">
                      Page {journalPageSafe} / {journalTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setJournalPage((p) =>
                          Math.min(journalTotalPages, p + 1),
                        )
                      }
                      disabled={journalPageSafe === journalTotalPages}
                      className="border px-3 py-1.5 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      onClick={() => setJournalPage(journalTotalPages)}
                      disabled={journalPageSafe === journalTotalPages}
                      className="border px-3 py-1.5 rounded disabled:opacity-50"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Accounts CRUD removed by request */}
          </section>
        </main>

        {/* Tabbed financial statements */}
        <section className="mt-2 bg-white rounded-xl p-3 sm:p-4 shadow">
          <div className="flex flex-col">
            <div className="border-b">
              <TabNav active={activeTab} setActive={setActiveTab} />
            </div>
            <div className="mt-4 overflow-x-auto">
              <TabPanels
                active={activeTab}
                bs={bs}
                is={is}
                cfs={cfs}
                equity={equity}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
function TabNav({
  active,
  setActive,
}: {
  active: number;
  setActive: (n: number) => void;
}) {
  const tabs = [
    "Balance Sheet",
    "Income Statement",
    "Cash Flow Statement",
    "Changes in Equity",
  ];

  return (
    <div className="flex gap-6 items-center px-2">
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => setActive(i)}
          className={`py-3 text-sm font-medium ${
            i === active
              ? "text-green-700 border-b-2 border-green-500"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

import type {
  BalanceSheet,
  IncomeStatement,
  CashFlowStatement,
  ChangesInEquity,
} from "../data/financials";

function TabPanels({
  active,
  bs,
  is,
  cfs,
  equity,
}: {
  active: number;
  bs: BalanceSheet;
  is: IncomeStatement;
  cfs: CashFlowStatement;
  equity: ChangesInEquity;
}) {
  const panels = [
    <div key="bs" className="text-sm text-gray-700">
      <table className="w-full text-left">
        <tbody>
          <tr>
            <td>Cash and Cash Equivalents</td>
            <td className="text-right">{formatRupiah(bs.cash)}</td>
          </tr>
          <tr>
            <td>Trade Receivables</td>
            <td className="text-right">{formatRupiah(bs.tradeReceivables)}</td>
          </tr>
          <tr>
            <td>Inventories</td>
            <td className="text-right">{formatRupiah(bs.inventories)}</td>
          </tr>
          <tr>
            <td>Property, Plant & Equipment (net)</td>
            <td className="text-right">{formatRupiah(bs.ppeNet)}</td>
          </tr>
          <tr className="font-semibold">
            <td>Total Assets</td>
            <td className="text-right">{formatRupiah(bs.totalAssets)}</td>
          </tr>
          <tr>
            <td>Trade Payables</td>
            <td className="text-right">{formatRupiah(bs.tradePayables)}</td>
          </tr>
          <tr>
            <td>Long-term Borrowings</td>
            <td className="text-right">
              {formatRupiah(bs.longTermBorrowings)}
            </td>
          </tr>
          <tr className="font-semibold">
            <td>Total Liabilities</td>
            <td className="text-right">{formatRupiah(bs.totalLiabilities)}</td>
          </tr>
          <tr>
            <td>Share Capital</td>
            <td className="text-right">{formatRupiah(bs.shareCapital)}</td>
          </tr>
          <tr>
            <td>Retained Earnings</td>
            <td className="text-right">{formatRupiah(bs.retainedEarnings)}</td>
          </tr>
          <tr className="font-semibold">
            <td>Total Equity</td>
            <td className="text-right">{formatRupiah(bs.totalEquity)}</td>
          </tr>
        </tbody>
      </table>
    </div>,

    <div key="is" className="text-sm text-gray-700">
      <table className="w-full text-left">
        <tbody>
          <tr>
            <td>Revenue</td>
            <td className="text-right">{formatRupiah(is.revenue)}</td>
          </tr>
          <tr>
            <td>Cost of Goods Sold</td>
            <td className="text-right">{formatRupiah(is.cogs)}</td>
          </tr>
          <tr className="font-semibold">
            <td>Gross Profit</td>
            <td className="text-right">{formatRupiah(is.grossProfit)}</td>
          </tr>
          <tr>
            <td>Operating Expenses</td>
            <td className="text-right">{formatRupiah(is.operatingExpenses)}</td>
          </tr>
          <tr className="font-semibold">
            <td>EBIT</td>
            <td className="text-right">{formatRupiah(is.ebit)}</td>
          </tr>
          <tr>
            <td>Interest Expense</td>
            <td className="text-right">{formatRupiah(is.interestExpense)}</td>
          </tr>
          <tr>
            <td>Profit Before Tax</td>
            <td className="text-right">{formatRupiah(is.profitBeforeTax)}</td>
          </tr>
          <tr>
            <td>Tax Expense</td>
            <td className="text-right">{formatRupiah(is.taxExpense)}</td>
          </tr>
          <tr className="font-semibold">
            <td>Net Income</td>
            <td className="text-right">{formatRupiah(is.netIncome)}</td>
          </tr>
        </tbody>
      </table>
    </div>,

    <div key="cf" className="text-sm text-gray-700">
      <table className="w-full text-left">
        <tbody>
          <tr>
            <td>Opening Cash</td>
            <td className="text-right">{formatRupiah(cfs.openingCash)}</td>
          </tr>
          <tr>
            <td>Cash from Operations</td>
            <td className="text-right">
              {formatRupiah(cfs.cashFromOperations)}
            </td>
          </tr>
          <tr>
            <td>Cash from Investing</td>
            <td className="text-right">
              {formatRupiah(cfs.cashFromInvesting)}
            </td>
          </tr>
          <tr>
            <td>Cash from Financing</td>
            <td className="text-right">
              {formatRupiah(cfs.cashFromFinancing)}
            </td>
          </tr>
          <tr className="font-semibold">
            <td>Net Change in Cash</td>
            <td className="text-right">{formatRupiah(cfs.netChangeInCash)}</td>
          </tr>
          <tr className="font-semibold">
            <td>Closing Cash</td>
            <td className="text-right">{formatRupiah(cfs.closingCash)}</td>
          </tr>
        </tbody>
      </table>
    </div>,

    <div key="ce" className="text-sm text-gray-700">
      <table className="w-full text-left">
        <tbody>
          <tr>
            <td>Opening Retained Earnings</td>
            <td className="text-right">
              {formatRupiah(equity.openingRetainedEarnings)}
            </td>
          </tr>
          <tr>
            <td>Net Income</td>
            <td className="text-right">{formatRupiah(equity.netIncome)}</td>
          </tr>
          <tr>
            <td>Dividends</td>
            <td className="text-right">{formatRupiah(equity.dividends)}</td>
          </tr>
          <tr className="font-semibold">
            <td>Closing Retained Earnings</td>
            <td className="text-right">
              {formatRupiah(equity.closingRetainedEarnings)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>,
  ];

  return <div className="p-2 text-sm text-gray-700">{panels[active]}</div>;
}
