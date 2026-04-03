export type BalanceSheet = {
  cash: number
  tradeReceivables: number
  inventories: number
  otherCurrentAssets: number
  ppeNet: number
  intangible: number
  totalAssets: number
  tradePayables: number
  shortTermBorrowings: number
  otherCurrentLiabilities: number
  longTermBorrowings: number
  deferredTaxLiabilities: number
  totalLiabilities: number
  shareCapital: number
  retainedEarnings: number
  totalEquity: number
}

export type IncomeStatement = {
  revenue: number
  cogs: number
  grossProfit: number
  operatingExpenses: number
  ebit: number
  interestExpense: number
  profitBeforeTax: number
  taxExpense: number
  netIncome: number
}

export type CashFlowStatement = {
  openingCash: number
  cashFromOperations: number
  cashFromInvesting: number
  cashFromFinancing: number
  netChangeInCash: number
  closingCash: number
  depreciation: number
}

export type ChangesInEquity = {
  openingRetainedEarnings: number
  netIncome: number
  dividends: number
  otherAdjustments?: number
  closingRetainedEarnings: number
}

// Helper to format numbers (not exported as default) - use in UI as needed
export function formatRupiah(value: number) {
  return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Dummy dataset for FY 2024 (numbers in Indonesian Rupiah)
export const balanceSheet2024: BalanceSheet = {
  cash: 150_000_000,
  tradeReceivables: 200_000_000,
  inventories: 100_000_000,
  otherCurrentAssets: 50_000_000,
  ppeNet: 600_000_000,
  intangible: 50_000_000,
  totalAssets: 1_150_000_000,
  tradePayables: 120_000_000,
  shortTermBorrowings: 100_000_000,
  otherCurrentLiabilities: 30_000_000,
  longTermBorrowings: 300_000_000,
  deferredTaxLiabilities: 40_000_000,
  totalLiabilities: 590_000_000,
  shareCapital: 300_000_000,
  retainedEarnings: 260_000_000,
  totalEquity: 560_000_000,
}

export const incomeStatement2024: IncomeStatement = {
  revenue: 1_200_000_000,
  cogs: 700_000_000,
  grossProfit: 500_000_000,
  operatingExpenses: 200_000_000,
  ebit: 300_000_000,
  interestExpense: 20_000_000,
  profitBeforeTax: 280_000_000,
  taxExpense: 70_000_000,
  netIncome: 210_000_000,
}

// Cash flow reconciles opening cash -> closing cash in balance sheet
export const cashFlow2024: CashFlowStatement = {
  openingCash: 100_000_000,
  depreciation: 50_000_000,
  cashFromOperations: 260_000_000, // netIncome + depreciation +/- working capital
  cashFromInvesting: -100_000_000, // capex
  cashFromFinancing: -110_000_000, // dividends + borrowings repayment
  netChangeInCash: 50_000_000, // 260 -100 -110 = 50
  closingCash: 150_000_000,
}

export const changesInEquity2024: ChangesInEquity = {
  openingRetainedEarnings: 100_000_000,
  netIncome: incomeStatement2024.netIncome,
  dividends: 50_000_000,
  otherAdjustments: 0,
  closingRetainedEarnings: 260_000_000,
}

// Quick consistency check function (returns boolean)
export function checkConsistency() {
  const assets = balanceSheet2024.totalAssets
  const liabilitiesPlusEquity = balanceSheet2024.totalLiabilities + balanceSheet2024.totalEquity
  const cashMatches = cashFlow2024.closingCash === balanceSheet2024.cash
  const retainedMatches = changesInEquity2024.closingRetainedEarnings === balanceSheet2024.retainedEarnings
  const netIncomeMatches = changesInEquity2024.netIncome === incomeStatement2024.netIncome
  return {
    assetsMatch: assets === liabilitiesPlusEquity,
    cashMatches,
    retainedMatches,
    netIncomeMatches,
  }
}
