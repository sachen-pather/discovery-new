// Budget Analysis Script - processes CSV bank statements and generates insights

async function fetchCSVData(url) {
  try {
    const response = await fetch(url);
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error("Error fetching CSV:", error);
    return null;
  }
}

function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

  const data = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    return row;
  });

  return { headers, data };
}

function findAmountColumn(headers) {
  const possibleNames = [
    "Amount",
    "amount",
    "AMOUNT",
    "Amount (ZAR)",
    "Amount(ZAR)",
    "amount_zar",
    "Debit",
    "debit",
    "DEBIT",
    "Credit",
    "credit",
    "CREDIT",
    "Transaction Amount",
    "transaction_amount",
    "Value",
    "value",
    "VALUE",
  ];

  for (const header of headers) {
    if (possibleNames.includes(header)) {
      return header;
    }
    const headerLower = header.toLowerCase();
    if (
      possibleNames.some((name) => headerLower.includes(name.toLowerCase()))
    ) {
      return header;
    }
  }
  return null;
}

function findDescriptionColumn(headers) {
  const possibleNames = [
    "Description",
    "description",
    "DESCRIPTION",
    "Transaction Description",
    "transaction_description",
    "Details",
    "details",
    "DETAILS",
    "Narration",
    "narration",
    "NARRATION",
  ];

  for (const header of headers) {
    if (possibleNames.includes(header)) {
      return header;
    }
  }
  return null;
}

function classifyTransaction(description, amount = null) {
  if (!description || description.trim() === "") {
    return "Other";
  }

  const descLower = description.toLowerCase();

  // Administrative/Banking fees
  if (
    ["opening balance", "account maintenance", "atm fee", "bank fee"].some(
      (word) => descLower.includes(word)
    )
  ) {
    return "Administrative";
  }

  // Money transfers
  if (
    ["money transfer", "transfer to", "transfer from"].some((word) =>
      descLower.includes(word)
    )
  ) {
    return "Other";
  }

  // Rent/Mortgage patterns
  if (
    ["rent", "mortgage", "room share", "accommodation"].some((word) =>
      descLower.includes(word)
    )
  ) {
    return "Rent/Mortgage";
  }

  // Groceries patterns
  if (
    [
      "shoprite",
      "pick n pay",
      "checkers",
      "spar",
      "woolworths",
      "groceries",
      "food store",
    ].some((word) => descLower.includes(word))
  ) {
    return "Groceries";
  }

  // Dining Out patterns
  if (
    [
      "kfc",
      "mcdonald",
      "restaurant",
      "takeaway",
      "food",
      "pizza",
      "burger",
      "nando",
    ].some((word) => descLower.includes(word))
  ) {
    return "Dining Out";
  }

  // Transport patterns
  if (
    ["taxi", "uber", "bolt", "transport", "fuel", "petrol", "bus fare"].some(
      (word) => descLower.includes(word)
    )
  ) {
    return "Transport";
  }

  // Subscriptions patterns
  if (
    [
      "insurance",
      "subscription",
      "netflix",
      "dstv",
      "vodacom",
      "mtn",
      "airtime",
      "data",
      "electricity",
      "prepaid electricity",
      "water",
      "municipal",
    ].some((word) => descLower.includes(word))
  ) {
    return "Subscriptions";
  }

  // Shopping patterns
  if (
    [
      "pep stores",
      "clothing",
      "edgars",
      "truworths",
      "shopping",
      "clothes",
      "fashion",
    ].some((word) => descLower.includes(word))
  ) {
    return "Shopping";
  }

  // ATM withdrawals
  if (descLower.includes("atm withdrawal")) {
    return "Other";
  }

  return "Other";
}

function categorizeIncomeExpense(description, amount) {
  if (!description || isNaN(amount)) {
    return "Other";
  }

  const descLower = description.toLowerCase();

  // Skip administrative entries
  if (
    ["opening balance", "closing balance"].some((word) =>
      descLower.includes(word)
    )
  ) {
    return "Other";
  }

  // Income indicators
  const incomeKeywords = [
    "salary",
    "wage",
    "income",
    "payment received",
    "deposit",
    "refund",
    "cashback",
    "interest",
    "dividend",
    "bonus",
    "transfer in",
    "credit",
    "reversal",
    "cash sales",
  ];

  // Check if it's likely income
  if (amount > 0) {
    if (incomeKeywords.some((keyword) => descLower.includes(keyword))) {
      return "Income";
    } else if (amount > 1000) {
      return "Income";
    }
  }

  // Everything else with negative amount is expense
  if (amount < 0) {
    return "Expense";
  }

  return "Other";
}

function generateCostCuttingSuggestions(categoryBreakdown, totalExpenses) {
  const suggestions = {};

  for (const [category, data] of Object.entries(categoryBreakdown)) {
    const { amount, percentage } = data;

    if (amount === 0) {
      suggestions[category] = {
        suggestions: ["No expenses in this category."],
        potential_savings: 0,
        current_amount: amount,
      };
      continue;
    }

    const categorySuggestions = [];
    let potentialSavings = 0;

    switch (category) {
      case "Rent/Mortgage":
        if (percentage > 35) {
          categorySuggestions.push(
            "Consider finding a cheaper room share or moving to a less expensive area"
          );
          potentialSavings = amount * 0.15;
        } else if (percentage > 25) {
          categorySuggestions.push(
            "Look for room sharing opportunities to split costs"
          );
          potentialSavings = amount * 0.1;
        } else {
          categorySuggestions.push(
            "Rent is within recommended range (25-35% of income)"
          );
        }
        break;

      case "Subscriptions":
        if (percentage > 15) {
          categorySuggestions.push(
            "Cancel unused subscriptions and switch to cheaper mobile plans"
          );
          potentialSavings = amount * 0.25;
        } else {
          categorySuggestions.push("Review and cancel any unused services");
          potentialSavings = amount * 0.15;
        }
        break;

      case "Dining Out":
        if (percentage > 15) {
          categorySuggestions.push(
            "Limit takeaways to once per week, cook more meals at home"
          );
          potentialSavings = amount * 0.4;
        } else if (percentage > 10) {
          categorySuggestions.push(
            "Reduce takeaways by half, meal prep on weekends"
          );
          potentialSavings = amount * 0.3;
        } else {
          categorySuggestions.push(
            "Continue current dining habits or look for special offers"
          );
          potentialSavings = amount * 0.1;
        }
        break;

      case "Transport":
        if (percentage > 20) {
          categorySuggestions.push(
            "Consider carpooling, walking for short distances, or monthly taxi passes"
          );
          potentialSavings = amount * 0.2;
        } else {
          categorySuggestions.push(
            "Look for discounted transport options or walk when possible"
          );
          potentialSavings = amount * 0.1;
        }
        break;

      case "Groceries":
        if (percentage > 20) {
          categorySuggestions.push(
            "Shop at cheaper stores, buy generic brands, meal plan weekly"
          );
          potentialSavings = amount * 0.2;
        } else {
          categorySuggestions.push(
            "Use store loyalty programs and buy items on special"
          );
          potentialSavings = amount * 0.1;
        }
        break;

      case "Shopping":
        if (percentage > 10) {
          categorySuggestions.push(
            "Implement a 'needs vs wants' rule, shop second-hand for clothing"
          );
          potentialSavings = amount * 0.35;
        } else {
          categorySuggestions.push(
            "Continue current shopping habits, look for sales"
          );
          potentialSavings = amount * 0.15;
        }
        break;

      default:
        categorySuggestions.push(
          "Review all miscellaneous expenses for potential savings"
        );
        potentialSavings = amount * 0.1;
    }

    suggestions[category] = {
      suggestions: categorySuggestions,
      potential_savings: potentialSavings,
      current_amount: amount,
    };
  }

  return suggestions;
}

async function analyzeBankStatement(csvUrl, profileName) {
  console.log(`Analyzing ${profileName}...`);

  const csvData = await fetchCSVData(csvUrl);
  if (!csvData) {
    console.error(`Failed to fetch data for ${profileName}`);
    return null;
  }

  const { headers, data } = csvData;
  const amountCol = findAmountColumn(headers);
  const descCol = findDescriptionColumn(headers);

  if (!amountCol || !descCol) {
    console.error(`Required columns not found for ${profileName}`);
    return null;
  }

  // Process transactions
  const processedData = data
    .map((row) => {
      const amount = Number.parseFloat(row[amountCol]) || 0;
      const description = row[descCol] || "";
      const category = classifyTransaction(description, amount);
      const transactionType = categorizeIncomeExpense(description, amount);

      return {
        ...row,
        amount,
        description,
        category,
        transactionType,
        absAmount: Math.abs(amount),
      };
    })
    .filter((row) => !isNaN(row.amount) && row.amount !== 0);

  // Calculate totals
  const totalIncome = processedData
    .filter((row) => row.transactionType === "Income")
    .reduce((sum, row) => sum + row.amount, 0);

  const expenseData = processedData.filter(
    (row) => row.transactionType === "Expense"
  );
  const totalExpenses = expenseData.reduce(
    (sum, row) => sum + row.absAmount,
    0
  );
  const availableIncome = totalIncome - totalExpenses;

  // Category breakdown
  const categories = [
    "Rent/Mortgage",
    "Subscriptions",
    "Dining Out",
    "Transport",
    "Groceries",
    "Shopping",
    "Other",
    "Administrative",
  ];
  const categoryBreakdown = {};

  categories.forEach((category) => {
    const categoryData = expenseData.filter((row) => row.category === category);
    const categoryTotal = categoryData.reduce(
      (sum, row) => sum + row.absAmount,
      0
    );
    const categoryPercentage =
      totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0;

    categoryBreakdown[category] = {
      amount: categoryTotal,
      percentage: categoryPercentage,
      count: categoryData.length,
    };
  });

  // Generate suggestions
  const suggestions = generateCostCuttingSuggestions(
    categoryBreakdown,
    totalExpenses
  );

  // Calculate potential savings
  const totalPotentialSavings = Object.values(suggestions).reduce(
    (sum, suggestion) => {
      return sum + (suggestion.potential_savings || 0);
    },
    0
  );

  const savingsRate =
    totalIncome > 0 ? (availableIncome / totalIncome) * 100 : 0;
  const improvedSavingsRate =
    totalIncome > 0
      ? ((availableIncome + totalPotentialSavings) / totalIncome) * 100
      : 0;

  // Financial health assessment
  let healthStatus = "";
  if (savingsRate >= 20) {
    healthStatus = "Excellent: You're saving over 20% of your income!";
  } else if (savingsRate >= 10) {
    healthStatus =
      "Good: You're saving 10-20% of your income. Room for improvement.";
  } else if (savingsRate >= 0) {
    healthStatus = "Caution: Low savings rate. Focus on expense reduction.";
  } else {
    healthStatus =
      "Alert: Spending more than you earn. Immediate action required.";
  }

  return {
    profileName,
    totalIncome,
    totalExpenses,
    availableIncome,
    savingsRate,
    categoryBreakdown,
    suggestions,
    totalPotentialSavings,
    improvedSavingsRate,
    healthStatus,
    transactionCount: processedData.length,
  };
}

// Export functions
export {
  analyzeBankStatement,
  classifyTransaction,
  generateCostCuttingSuggestions,
  fetchCSVData,
  parseCSV,
};
