import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Time "mo:core/Time";
import VarArray "mo:core/VarArray";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type Habit = {
    id : Text;
    name : Text;
    color : Text;
    createdAt : Int;
  };

  type HabitLog = {
    habitId : Text;
    date : Text;
    done : Bool;
    timeNote : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  module Habit {
    public func compare(habit1 : Habit, habit2 : Habit) : Order.Order {
      Text.compare(habit1.id, habit2.id);
    };
  };

  module HabitLog {
    public func compare(log1 : HabitLog, log2 : HabitLog) : Order.Order {
      Text.compare(log1.date, log2.date);
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let habitsByUser = Map.empty<Principal, Map.Map<Text, Habit>>();
  let logsByUser = Map.empty<Principal, Map.Map<Text, Map.Map<Text, HabitLog>>>();
  let shareTokens = Map.empty<Text, Principal>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  func getHabitsInternal(caller : Principal) : Map.Map<Text, Habit> {
    switch (habitsByUser.get(caller)) {
      case (null) { Runtime.trap("No habits found for user") };
      case (?habits) { habits };
    };
  };

  func getLogsInternal(caller : Principal) : Map.Map<Text, Map.Map<Text, HabitLog>> {
    switch (logsByUser.get(caller)) {
      case (null) { Runtime.trap("No logs found for user") };
      case (?logs) { logs };
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
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

  // Habit Management
  public shared ({ caller }) func addHabit(name : Text, color : Text) : async Habit {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add habits");
    };

    let habitId = name.concat(Time.now().toText());
    let habit : Habit = {
      id = habitId;
      name;
      color;
      createdAt = Time.now();
    };

    let habits = switch (habitsByUser.get(caller)) {
      case (null) { Map.empty<Text, Habit>() };
      case (?h) { h };
    };

    habits.add(habitId, habit);
    habitsByUser.add(caller, habits);

    habit;
  };

  public shared ({ caller }) func removeHabit(habitId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove habits");
    };

    switch (habitsByUser.get(caller)) {
      case (null) { false };
      case (?habits) {
        let updatedHabits = Map.empty<Text, Habit>();
        for ((id, habit) in habits.entries()) {
          if (id != habitId) {
            updatedHabits.add(id, habit);
          };
        };
        habitsByUser.add(caller, updatedHabits);

        switch (logsByUser.get(caller)) {
          case (null) {};
          case (?userLogs) {
            let updatedLogs = Map.empty<Text, Map.Map<Text, HabitLog>>();
            for ((hId, habitLogs) in userLogs.entries()) {
              if (hId != habitId) {
                updatedLogs.add(hId, habitLogs);
              };
            };
            logsByUser.add(caller, updatedLogs);
          };
        };

        true;
      };
    };
  };

  public query ({ caller }) func getHabits() : async [Habit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view habits");
    };

    switch (habitsByUser.get(caller)) {
      case (null) { [] };
      case (?habits) {
        habits.values().toArray().sort();
      };
    };
  };

  public query ({ caller }) func getHabitsForUser(user : Principal) : async [Habit] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own habits");
    };

    switch (habitsByUser.get(user)) {
      case (null) { [] };
      case (?habits) {
        habits.values().toArray().sort();
      };
    };
  };

  // Habit Logging
  public shared ({ caller }) func logHabit(habitId : Text, date : Text, done : Bool, timeNote : Text) : async HabitLog {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log habits");
    };

    let log : HabitLog = {
      habitId;
      date;
      done;
      timeNote;
    };

    let logs = switch (logsByUser.get(caller)) {
      case (null) { Map.empty<Text, Map.Map<Text, HabitLog>>() };
      case (?l) { l };
    };

    if (logs.containsKey(habitId)) {
      switch (logs.get(habitId)) {
        case (?habitLogs) {
          habitLogs.add(date, log);
          logs.add(habitId, habitLogs);
        };
        case (null) {
          let habitLogs = Map.empty<Text, HabitLog>();
          habitLogs.add(date, log);
          logs.add(habitId, habitLogs);
        };
      };
    } else {
      let habitLogs = Map.empty<Text, HabitLog>();
      habitLogs.add(date, log);
      logs.add(habitId, habitLogs);
    };

    logsByUser.add(caller, logs);

    log;
  };

  public query ({ caller }) func getLogs(startDate : Text, endDate : Text) : async [HabitLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    switch (logsByUser.get(caller)) {
      case (null) { [] };
      case (?logs) {
        let habitLogsInRange = VarArray.repeat<[HabitLog]>([], logs.size());
        var habitLogInRangeCount = 0;

        for ((habitId, habit) in logs.entries()) {
          switch (logs.get(habitId)) {
            case (null) {};
            case (?habitLogs) {
              let logsInRangeForHabit = VarArray.repeat<HabitLog>(
                {
                  habitId = "";
                  date = "";
                  done = false;
                  timeNote = "";
                },
                habitLogs.size(),
              );
              var logInRangeCount = 0;

              let entries = habitLogs.entries();
              for ((date, log) in entries) {
                if ((date >= startDate and date <= endDate)) {
                  if (logInRangeCount < logsInRangeForHabit.size()) {
                    logsInRangeForHabit[logInRangeCount] := log;
                    logInRangeCount += 1;
                  };
                };
              };

              if (logInRangeCount > 0 and habitLogInRangeCount < habitLogsInRange.size()) {
                let logsInRangeForHabitSlice = logsInRangeForHabit.toArray().sliceToArray(0, logInRangeCount);
                habitLogsInRange[habitLogInRangeCount] := logsInRangeForHabitSlice;
                habitLogInRangeCount += 1;
              };
            };
          };
        };

        let resultArray = VarArray.repeat<HabitLog>(
          {
            habitId = "";
            date = "";
            done = false;
            timeNote = "";
          },
          logs.size(),
        );

        var count = 0;
        for (i in Nat.range(0, habitLogInRangeCount)) {
          let entry = habitLogsInRange[i];
          for (j in Nat.range(0, entry.size())) {
            resultArray[count] := entry[j];
            count += 1;
          };
        };
        resultArray.toArray().sliceToArray(0, count);
      };
    };
  };

  // Share Token Management
  public shared ({ caller }) func generateShareToken() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate share tokens");
    };

    let token = Time.now().toText().concat(".gtw32u=");
    shareTokens.add(token, caller);
    token;
  };

  // Public - no auth needed, uses token for access. Returns ALL logs (no date filter).
  public query func getSharedTracker(token : Text) : async ?{
    habits : [Habit];
    logs : [HabitLog];
  } {
    switch (shareTokens.get(token)) {
      case (null) { return null };
      case (?userPrincipal) {
        let habits = switch (habitsByUser.get(userPrincipal)) {
          case (null) { [] };
          case (?habits) {
            habits.values().toArray().sort();
          };
        };

        let logs = switch (logsByUser.get(userPrincipal)) {
          case (null) { [] };
          case (?userLogs) {
            // Collect all logs from all habits
            let allLogsArr = VarArray.repeat<[HabitLog]>([], userLogs.size());
            var allLogsCount = 0;
            var totalCount = 0;

            for ((habitId, habitLogs) in userLogs.entries()) {
              let arr = habitLogs.values().toArray();
              if (allLogsCount < allLogsArr.size()) {
                allLogsArr[allLogsCount] := arr;
                allLogsCount += 1;
                totalCount += arr.size();
              };
            };

            let resultArray = VarArray.repeat<HabitLog>(
              { habitId = ""; date = ""; done = false; timeNote = "" },
              totalCount,
            );
            var count = 0;
            for (i in Nat.range(0, allLogsCount)) {
              let entry = allLogsArr[i];
              for (j in Nat.range(0, entry.size())) {
                resultArray[count] := entry[j];
                count += 1;
              };
            };
            resultArray.toArray().sliceToArray(0, count);
          };
        };

        ?{ habits; logs };
      };
    };
  };

  // Additional Query Functions
  public query ({ caller }) func getLogsForHabit(habitId : Text, startDate : Text, endDate : Text) : async [HabitLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    switch (logsByUser.get(caller)) {
      case (null) { [] };
      case (?habitLogs) {
        switch (habitLogs.get(habitId)) {
          case (null) { [] };
          case (?logs) {
            logs.values().toArray().sort().filter(func(log) { log.date >= startDate and log.date <= endDate });
          };
        };
      };
    };
  };

  public query ({ caller }) func getCallerLogs(habitId : Text, startDate : Text, endDate : Text) : async [HabitLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    switch (logsByUser.get(caller)) {
      case (null) { [] };
      case (?habitLogs) {
        switch (habitLogs.get(habitId)) {
          case (null) { [] };
          case (?logs) {
            logs.values().toArray().sort();
          };
        };
      };
    };
  };

  public query ({ caller }) func getHabitHistory(habitId : Text, startDate : Text, endDate : Text) : async [HabitLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view habit history");
    };

    switch (logsByUser.get(caller)) {
      case (null) { [] };
      case (?habitLogs) {
        switch (habitLogs.get(habitId)) {
          case (null) { [] };
          case (?logs) {
            logs.values().toArray().filter(func(log) { log.date >= startDate and log.date <= endDate }).sort();
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllHabits() : async [Habit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all habits");
    };

    let allHabits = habitsByUser.values().flatMap(
      func(userHabits) {
        userHabits.values();
      }
    );
    allHabits.sort().toArray();
  };

};
