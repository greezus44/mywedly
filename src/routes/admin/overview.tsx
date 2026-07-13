import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingEvent, type GuestbookEntry, type Guest, type Rsvp, type SharingEvent } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate, formatTime } from "../../lib/utils";
import { Users, Calendar, Heart, MessageSquare, Globe, Eye, TrendingUp, Clock } from "lucide-react";

export function OverviewPage() {
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: wedding, isLoading: weddingLoading } = useQuery({
    queryKey: ["wedding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.id).maybeSingle();
      return data as Wedding | null;
    },
    enabled: !!user,
  });

  const { data: guests } = useQuery({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as Guest[];
    },
    enabled: !!wedding,
  });

  const { data: events } = useQuery({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at", { ascending: true });
      return (data || []) as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const { data: rsvps } = useQuery({
    queryKey: ["rsvps", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("rsvps").select("*").eq("wedding_id", wedding.id);
      return (data || []) as Rsvp[];
    },
    enabled: !!wedding,
  });

  const { data: messages } = useQuery({
    queryKey: ["guestbook", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const { data: visits } = useQuery({
    queryKey: ["sharing-events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("sharing_events").select("*").eq("wedding_id", wedding.id);
      return (data || []) as SharingEvent[];
    },
    enabled: !!wedding,
  });

  if (weddingLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading your Wedding Creator Dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  const upcomingEvents = (events || [])
    .filter((e) => e.starts_at && new Date(e.starts_at) > new Date())
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime())
    .slice(0, 5);

  const recentMessages = (messages || []).slice(0, 5);
  const attendingCount = (rsvps || []).filter((r) => r.status === "attending").length;
  const pendingMessages = (messages || []).filter((m) => m.status === "pending").length;

  const stats = [
    { label: "Total Guests", value: guests?.length || 0, icon: Users, color: "text-gray-900" },
    { label: "Events", value: events?.length || 0, icon: Calendar, color: "text-gray-900" },
    { label: "RSVPs Received", value: rsvps?.length || 0, icon: Heart, color: "text-gray-900" },
    { label: "Guestbook Messages", value: messages?.length || 0, icon: MessageSquare, color: "text-gray-900" },
    { label: "Published", value: wedding?.is_published ? "Live" : "Draft", icon: Globe, color: wedding?.is_published ? "text-green-600" : "text-gray-500" },
    { label: "Total Visits", value: visits?.length || 0, icon: Eye, color: "text-gray-900" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wedding Creator Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome back! Here's an overview of your wedding invitation.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="rounded-lg bg-gray-100 p-3">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Heart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Attending</p>
                <p className="text-xl font-bold text-gray-900">{attendingCount}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <MessageSquare className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Messages</p>
                <p className="text-xl font-bold text-gray-900">{pendingMessages}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <TrendingUp className="h-5 w-5 text-gray-900" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Engagement</p>
                <p className="text-xl font-bold text-gray-900">{visits?.length || 0} visits</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upcoming Events */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            </div>
            {upcomingEvents.length === 0 ? (
              <EmptyState icon={<Calendar className="h-8 w-8" />} title="No upcoming events" description="Add events to share your schedule with guests." />
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div>
                      <p className="font-medium text-gray-900">{event.name}</p>
                      <p className="text-sm text-gray-500">{event.venue_name || "No venue set"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatDate(event.starts_at)}</p>
                      <p className="text-sm text-gray-500">{formatTime(event.starts_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Messages */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
            </div>
            {recentMessages.length === 0 ? (
              <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="No messages yet" description="Guestbook messages will appear here." />
            ) : (
              <div className="space-y-3">
                {recentMessages.map((msg) => (
                  <div key={msg.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="font-medium text-gray-900">{msg.author_name}</p>
                      <Badge variant={msg.status === "approved" ? "success" : msg.status === "rejected" ? "error" : "warning"}>
                        {msg.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
