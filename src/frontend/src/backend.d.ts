import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Habit {
    id: string;
    name: string;
    createdAt: bigint;
    color: string;
}
export interface HabitLog {
    date: string;
    done: boolean;
    habitId: string;
    timeNote: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addHabit(name: string, color: string): Promise<Habit>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    generateShareToken(): Promise<string>;
    getAllHabits(): Promise<Array<Habit>>;
    getCallerLogs(habitId: string, startDate: string, endDate: string): Promise<Array<HabitLog>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getHabitHistory(habitId: string, startDate: string, endDate: string): Promise<Array<HabitLog>>;
    getHabits(): Promise<Array<Habit>>;
    getHabitsForUser(user: Principal): Promise<Array<Habit>>;
    getLogs(startDate: string, endDate: string): Promise<Array<HabitLog>>;
    getLogsForHabit(habitId: string, startDate: string, endDate: string): Promise<Array<HabitLog>>;
    getSharedTracker(token: string): Promise<{
        logs: Array<HabitLog>;
        habits: Array<Habit>;
    } | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    logHabit(habitId: string, date: string, done: boolean, timeNote: string): Promise<HabitLog>;
    removeHabit(habitId: string): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
