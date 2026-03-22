import Float "mo:core/Float";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Option "mo:core/Option";
import Iter "mo:core/Iter";

actor {
  // Incorporate authorization component
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Transaction = {
    id : Text;
    amount : Float;
    description : Text;
    category : Text;
    date : Int;
    transactionType : TransactionType;
    created : Int;
  };

  type TransactionType = {
    #income;
    #expense;
  };

  public type BudgetLimit = {
    category : Text;
    amount : Float;
  };

  public type UserProfile = {
    name : Text;
  };

  module Transaction {
    public func compare(t1 : Transaction, t2 : Transaction) : Order.Order {
      Text.compare(t1.id, t2.id);
    };

    public func compareByDate(t1 : Transaction, t2 : Transaction) : Order.Order {
      Int.compare(t1.date, t2.date);
    };

    public func compareByCreated(t1 : Transaction, t2 : Transaction) : Order.Order {
      Int.compare(t2.created, t1.created); // Descending order (most recent first)
    };

    public func compareByAmount(t1 : Transaction, t2 : Transaction) : Order.Order {
      Float.compare(t1.amount, t2.amount);
    };

    public func compareByCategoryAndDate(t1 : Transaction, t2 : Transaction) : Order.Order {
      switch (Text.compare(t1.category, t2.category)) {
        case (#equal) { Int.compare(t1.date, t2.date) };
        case (order) { order };
      };
    };
  };

  // Helper function to get current timestamp
  func getCurrentTime() : Int {
    Time.now();
  };

  // Helper function to check if a timestamp is in a given month/year
  func isInMonth(timestamp : Int, month : Int, year : Int) : Bool {
    let nanosPerSecond : Int = 1_000_000_000;
    let secondsPerDay : Int = 86400;
    let daysPerYear : Int = 365;
    
    // Simple approximation - convert timestamp to days since epoch
    let days = timestamp / (nanosPerSecond * secondsPerDay);
    let approxYear = 1970 + days / daysPerYear;
    
    // This is a simplified check - in production, use a proper date library
    // For now, we'll use a simple range check
    let monthStart = getMonthStartTimestamp(month, year);
    let monthEnd = getMonthEndTimestamp(month, year);
    
    timestamp >= monthStart and timestamp < monthEnd;
  };

  // Helper to get month start timestamp (simplified)
  func getMonthStartTimestamp(month : Int, year : Int) : Int {
    // Simplified - returns approximate timestamp
    // In production, use proper date handling
    let nanosPerSecond : Int = 1_000_000_000;
    let secondsPerDay : Int = 86400;
    let daysPerYear : Int = 365;
    let baseYear = 1970;
    
    let yearsSince1970 = year - baseYear;
    let daysSinceEpoch = yearsSince1970 * daysPerYear + (month - 1) * 30;
    
    daysSinceEpoch * secondsPerDay * nanosPerSecond;
  };

  // Helper to get month end timestamp (simplified)
  func getMonthEndTimestamp(month : Int, year : Int) : Int {
    let nanosPerSecond : Int = 1_000_000_000;
    let secondsPerDay : Int = 86400;
    let daysPerYear : Int = 365;
    let baseYear = 1970;
    
    let yearsSince1970 = year - baseYear;
    let daysSinceEpoch = yearsSince1970 * daysPerYear + month * 30;
    
    daysSinceEpoch * secondsPerDay * nanosPerSecond;
  };

  let userTransactions = Map.empty<Principal, List.List<Transaction>>();
  let userBudgets = Map.empty<Principal, Map.Map<Text, Float>>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Predefined categories
  let categories = [
    "Food",
    "Rent",
    "Transport",
    "Shopping",
    "Entertainment",
    "Healthcare",
    "Other",
  ];

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Transaction CRUD Operations

  // Create transaction
  public shared ({ caller }) func addTransaction(transaction : Transaction) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add transactions");
    };

    let createdTransaction : Transaction = {
      transaction with
      created = getCurrentTime();
    };

    let existingTransactions = switch (userTransactions.get(caller)) {
      case (null) { List.empty<Transaction>() };
      case (?transactions) { transactions };
    };

    existingTransactions.add(createdTransaction);
    userTransactions.add(caller, existingTransactions);
  };

  // Read - Get all transactions
  public query ({ caller }) func getTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    switch (userTransactions.get(caller)) {
      case (null) { [] };
      case (?transactions) { transactions.toArray().sort() };
    };
  };

  // Update transaction
  public shared ({ caller }) func updateTransaction(transactionId : Text, updatedTransaction : Transaction) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update transactions");
    };

    switch (userTransactions.get(caller)) {
      case (null) { false };
      case (?transactions) {
        let updatedList = List.empty<Transaction>();
        var found = false;

        for (t in transactions.values()) {
          if (t.id == transactionId) {
            updatedList.add({
              updatedTransaction with
              id = transactionId;
              created = t.created; // Keep original creation time
            });
            found := true;
          } else {
            updatedList.add(t);
          };
        };

        if (found) {
          userTransactions.add(caller, updatedList);
        };
        found;
      };
    };
  };

  // Delete transaction
  public shared ({ caller }) func deleteTransaction(transactionId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete transactions");
    };

    switch (userTransactions.get(caller)) {
      case (null) { false };
      case (?transactions) {
        let filteredList = transactions.filter(func(t) { t.id != transactionId });
        let originalSize = transactions.size();
        let newSize = filteredList.size();
        
        if (originalSize > newSize) {
          userTransactions.add(caller, filteredList);
          true;
        } else {
          false;
        };
      };
    };
  };

  // Get transactions by category
  public query ({ caller }) func getTransactionsByCategory(category : Text) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    switch (userTransactions.get(caller)) {
      case (null) { [] };
      case (?transactions) {
        transactions.filter(func(t) { t.category == category }).toArray().sort(Transaction.compareByDate);
      };
    };
  };

  // Get transactions by type (income/expense)
  public query ({ caller }) func getTransactionsByType(transactionType : TransactionType) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    switch (userTransactions.get(caller)) {
      case (null) { [] };
      case (?transactions) {
        transactions.filter(func(t) { t.transactionType == transactionType }).toArray();
      };
    };
  };

  // Get recent transactions (last N)
  public query ({ caller }) func getRecentTransactions(limit : Nat) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    switch (userTransactions.get(caller)) {
      case (null) { [] };
      case (?transactions) {
        let sorted = transactions.toArray().sort(Transaction.compareByCreated);
        let size = sorted.size();
        let takeCount = if (limit < size) { limit } else { size };
        
        let result = List.empty<Transaction>();
        var count = 0;
        for (t in sorted.vals()) {
          if (count < takeCount) {
            result.add(t);
            count += 1;
          };
        };
        result.toArray();
      };
    };
  };

  // Get predefined categories (accessible to all, including guests)
  public query ({ caller }) func getCategories() : async [Text] {
    categories;
  };

  // Budget Management

  // Set budget limit for a category
  public shared ({ caller }) func setBudgetLimit(category : Text, amount : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set budget limits");
    };

    let budgetMap = switch (userBudgets.get(caller)) {
      case (null) { Map.empty<Text, Float>() };
      case (?existing) { existing };
    };

    budgetMap.add(category, amount);
    userBudgets.add(caller, budgetMap);
  };

  // Get budget limit for a category
  public query ({ caller }) func getBudgetLimit(category : Text) : async ?Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view budget limits");
    };

    switch (userBudgets.get(caller)) {
      case (null) { null };
      case (?budgetMap) { budgetMap.get(category) };
    };
  };

  // Get all budget limits
  public query ({ caller }) func getAllBudgetLimits() : async [BudgetLimit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view budget limits");
    };

    switch (userBudgets.get(caller)) {
      case (null) { [] };
      case (?budgetMap) {
        let result = List.empty<BudgetLimit>();
        for ((category, amount) in budgetMap.entries()) {
          result.add({ category; amount });
        };
        result.toArray();
      };
    };
  };

  // Summary Queries

  // Get total balance
  public query ({ caller }) func getTotalBalance() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view balance");
    };

    switch (userTransactions.get(caller)) {
      case (null) { 0 };
      case (?transactions) {
        var balance = 0.0;
        for (transaction in transactions.values()) {
          switch (transaction.transactionType) {
            case (#income) { balance += transaction.amount };
            case (#expense) { balance -= transaction.amount };
          };
        };
        balance;
      };
    };
  };

  // Get total income for a specific month
  public query ({ caller }) func getTotalIncomeForMonth(month : Int, year : Int) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view income");
    };

    switch (userTransactions.get(caller)) {
      case (null) { 0 };
      case (?transactions) {
        var total = 0.0;
        for (transaction in transactions.values()) {
          if (isInMonth(transaction.date, month, year) and transaction.transactionType == #income) {
            total += transaction.amount;
          };
        };
        total;
      };
    };
  };

  // Get total expenses for a specific month
  public query ({ caller }) func getTotalExpensesForMonth(month : Int, year : Int) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };

    switch (userTransactions.get(caller)) {
      case (null) { 0 };
      case (?transactions) {
        var total = 0.0;
        for (transaction in transactions.values()) {
          if (isInMonth(transaction.date, month, year) and transaction.transactionType == #expense) {
            total += transaction.amount;
          };
        };
        total;
      };
    };
  };

  // Get spending by category for a specific month
  public query ({ caller }) func getSpendingByCategory(month : Int, year : Int) : async [(Text, Float)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view spending");
    };

    switch (userTransactions.get(caller)) {
      case (null) { [] };
      case (?transactions) {
        let categoryTotals = Map.empty<Text, Float>();
        
        for (transaction in transactions.values()) {
          if (isInMonth(transaction.date, month, year) and transaction.transactionType == #expense) {
            let currentTotal = categoryTotals.get(transaction.category).get(0.0);
            categoryTotals.add(transaction.category, currentTotal + transaction.amount);
          };
        };

        let result = List.empty<(Text, Float)>();
        for ((category, total) in categoryTotals.entries()) {
          result.add((category, total));
        };
        result.toArray();
      };
    };
  };
};
