CREATE TABLE "ball_by_ball" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"innings" integer NOT NULL,
	"over_number" integer NOT NULL,
	"ball_number" integer NOT NULL,
	"batsman_id" integer NOT NULL,
	"bowler_id" integer NOT NULL,
	"runs_scored" integer DEFAULT 0,
	"extras" integer DEFAULT 0,
	"extras_type" text,
	"is_wicket" boolean DEFAULT false,
	"dismissal_type" text,
	"player_out_id" integer,
	"fielder_id" integer,
	"commentary" text,
	"shot_type" text,
	"shot_direction" integer,
	"shot_distance" numeric(2),
	"ball_speed" integer,
	"ball_length" text,
	"ball_line" text,
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blocked_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"blocker_id" integer NOT NULL,
	"blocked_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comment_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"comment_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"user_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_url" text,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "content_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "content_engagement" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"engagement_type" text NOT NULL,
	"engagement_score" numeric(2) DEFAULT '0',
	"duration" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"reward_type" text NOT NULL,
	"points" integer DEFAULT 0,
	"description" text,
	"awarded_by" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user1_id" integer NOT NULL,
	"user2_id" integer NOT NULL,
	"last_message_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "heat_map_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"match_id" integer,
	"is_for_batting" boolean NOT NULL,
	"zone_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"reaction_type" text DEFAULT 'like' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "match_highlights" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"ball_id" integer,
	"media_url" text,
	"thumbnail_url" text,
	"player_id" integer,
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "match_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_playing" boolean DEFAULT true,
	"is_captain" boolean DEFAULT false,
	"is_vice_captain" boolean DEFAULT false,
	"is_wicketkeeper" boolean DEFAULT false,
	"batting_position" integer,
	"bowling_position" integer,
	"player_match_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"venue" text,
	"match_date" timestamp NOT NULL,
	"match_type" text NOT NULL,
	"overs" integer NOT NULL,
	"team1_id" integer NOT NULL,
	"team2_id" integer NOT NULL,
	"team1_score" integer DEFAULT 0,
	"team1_wickets" integer DEFAULT 0,
	"team1_overs" numeric(2) DEFAULT '0',
	"team2_score" integer DEFAULT 0,
	"team2_wickets" integer DEFAULT 0,
	"team2_overs" numeric(2) DEFAULT '0',
	"status" text DEFAULT 'upcoming' NOT NULL,
	"result" text,
	"winner" integer,
	"toss_winner" integer,
	"toss_decision" text,
	"current_innings" integer DEFAULT 1,
	"main_umpire_id" integer,
	"second_umpire_id" integer,
	"third_umpire_id" integer,
	"match_referee_id" integer,
	"weather_conditions" text,
	"pitch_conditions" text,
	"toss_time" timestamp,
	"match_start_time" timestamp,
	"match_end_time" timestamp,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text' NOT NULL,
	"media_url" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partnerships" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"innings" integer NOT NULL,
	"batsman1_id" integer NOT NULL,
	"batsman2_id" integer NOT NULL,
	"runs" integer DEFAULT 0,
	"balls" integer DEFAULT 0,
	"start_over" numeric(1),
	"end_over" numeric(1),
	"is_current" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_match_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"match_id" integer NOT NULL,
	"runs_scored" integer DEFAULT 0,
	"balls_faced" integer DEFAULT 0,
	"fours" integer DEFAULT 0,
	"sixes" integer DEFAULT 0,
	"batting_status" text,
	"batting_position" integer,
	"batting_style" text,
	"strike_rate" numeric(2),
	"overs_bowled" numeric DEFAULT '0',
	"runs_conceded" integer DEFAULT 0,
	"wickets_taken" integer DEFAULT 0,
	"maidens" integer DEFAULT 0,
	"bowling_position" integer,
	"bowling_style" text,
	"economy_rate" numeric(2),
	"catches" integer DEFAULT 0,
	"run_outs" integer DEFAULT 0,
	"stumpings" integer DEFAULT 0,
	"player_of_match" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"match_name" text NOT NULL,
	"match_date" timestamp NOT NULL,
	"venue" text,
	"opponent" text NOT NULL,
	"match_type" text,
	"team_score" text,
	"opponent_score" text,
	"result" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"position" text,
	"batting_style" text,
	"bowling_style" text,
	"player_of_match_awards" integer DEFAULT 0,
	"highest_score_not_out" boolean DEFAULT false,
	"total_matches" integer DEFAULT 0,
	"total_runs" integer DEFAULT 0,
	"total_wickets" integer DEFAULT 0,
	"total_catches" integer DEFAULT 0,
	"total_sixes" integer DEFAULT 0,
	"total_fours" integer DEFAULT 0,
	"highest_score" integer DEFAULT 0,
	"best_bowling" text DEFAULT '0/0',
	"batting_average" numeric(2) DEFAULT '0',
	"bowling_average" numeric(2) DEFAULT '0',
	"strike_rate" numeric(2) DEFAULT '0',
	"economy_rate" numeric(2) DEFAULT '0',
	"innings" integer DEFAULT 0,
	"not_outs" integer DEFAULT 0,
	"balls_faced" integer DEFAULT 0,
	"overs_bowled" text DEFAULT '0',
	"runs_conceded" integer DEFAULT 0,
	"maidens" integer DEFAULT 0,
	"fifties" integer DEFAULT 0,
	"hundreds" integer DEFAULT 0,
	"total_run_outs" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_tournament_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"matches" integer DEFAULT 0,
	"runs" integer DEFAULT 0,
	"balls_faced" integer DEFAULT 0,
	"fours" integer DEFAULT 0,
	"sixes" integer DEFAULT 0,
	"fifties" integer DEFAULT 0,
	"hundreds" integer DEFAULT 0,
	"highest_score" integer DEFAULT 0,
	"batting_average" numeric(6, 2) DEFAULT '0',
	"strike_rate" numeric(6, 2) DEFAULT '0',
	"overs" numeric(6, 1) DEFAULT '0',
	"wickets" integer DEFAULT 0,
	"runs_conceded" integer DEFAULT 0,
	"maidens" integer DEFAULT 0,
	"five_wickets" integer DEFAULT 0,
	"bowling_average" numeric(6, 2) DEFAULT '0',
	"economy_rate" numeric(6, 2) DEFAULT '0',
	"catches" integer DEFAULT 0,
	"run_outs" integer DEFAULT 0,
	"stumpings" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "player_vs_player_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"batsman_id" integer NOT NULL,
	"bowler_id" integer NOT NULL,
	"balls_faced" integer DEFAULT 0,
	"runs_scored" integer DEFAULT 0,
	"dismissals" integer DEFAULT 0,
	"fours" integer DEFAULT 0,
	"sixes" integer DEFAULT 0,
	"dot_balls" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"option" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"poll_id" integer NOT NULL,
	"option_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"question" text NOT NULL,
	"poll_type" text NOT NULL,
	"match_id" integer,
	"player_id" integer,
	"team_id" integer,
	"end_time" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "post_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"share_type" text NOT NULL,
	"recipient_id" integer,
	"platform" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "post_tags" (
	"post_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "post_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content" text,
	"image_url" text,
	"video_url" text,
	"thumbnail_url" text,
	"location" text,
	"category" text,
	"match_id" text,
	"team_id" text,
	"player_id" text,
	"duration" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"image_url" text,
	"caption" text,
	"filter_id" text,
	"effect_ids" text,
	"media_type" text DEFAULT 'image' NOT NULL,
	"video_url" text,
	"music_track_id" text,
	"match_id" integer,
	"is_highlight" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "story_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"story_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"story_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"reaction_type" text DEFAULT 'like' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"story_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"popularity_score" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "team_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"player_role" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"short_name" text,
	"description" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"type" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"match_id" integer NOT NULL,
	"round" integer,
	"match_number" integer,
	"group" text,
	"stage" text,
	"venue_id" integer,
	"scheduled_date" timestamp,
	"scheduled_time" text,
	"status" text DEFAULT 'scheduled',
	"home_team_id" integer,
	"away_team_id" integer,
	"home_team_score" text,
	"away_team_score" text,
	"result" text,
	"result_details" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_standings" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"group" text,
	"played" integer DEFAULT 0,
	"won" integer DEFAULT 0,
	"lost" integer DEFAULT 0,
	"tied" integer DEFAULT 0,
	"no_result" integer DEFAULT 0,
	"points" integer DEFAULT 0,
	"net_run_rate" numeric DEFAULT '0',
	"for_runs" integer DEFAULT 0,
	"for_overs" numeric DEFAULT '0',
	"against_runs" integer DEFAULT 0,
	"against_overs" numeric DEFAULT '0',
	"position" integer,
	"qualified" boolean,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"stat_category" text NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"runs" integer DEFAULT 0,
	"balls_faced" integer DEFAULT 0,
	"fours" integer DEFAULT 0,
	"sixes" integer DEFAULT 0,
	"highest" integer DEFAULT 0,
	"fifties" integer DEFAULT 0,
	"hundreds" integer DEFAULT 0,
	"strike_rate" numeric DEFAULT '0',
	"average" numeric DEFAULT '0',
	"wickets" integer DEFAULT 0,
	"overs" numeric DEFAULT '0',
	"maidens" integer DEFAULT 0,
	"economy" numeric DEFAULT '0',
	"best_bowling" text,
	"catches" integer DEFAULT 0,
	"stumpings" integer DEFAULT 0,
	"run_outs" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"registration_date" timestamp DEFAULT now(),
	"registration_status" text DEFAULT 'pending',
	"payment_status" text DEFAULT 'unpaid',
	"paid_amount" numeric DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"registration_deadline" timestamp,
	"max_teams" integer,
	"entry_fee" numeric DEFAULT '0',
	"prize_pool" numeric DEFAULT '0',
	"format" text NOT NULL,
	"tournament_type" text NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"organizer_id" integer NOT NULL,
	"logo_url" text,
	"banner_url" text,
	"rules" text,
	"contact_email" text,
	"contact_phone" text,
	"is_public" boolean DEFAULT true,
	"points_per_win" integer DEFAULT 2,
	"points_per_loss" integer DEFAULT 0,
	"points_per_tie" integer DEFAULT 1,
	"points_per_no_result" integer DEFAULT 1,
	"qualification_rules" text,
	"tiebreakers" text,
	"overs" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_interests" (
	"user_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"interaction_score" numeric(2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_interests_user_id_tag_id_pk" PRIMARY KEY("user_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"full_name" text,
	"email" text NOT NULL,
	"bio" text,
	"location" text,
	"profile_image" text,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_player" boolean DEFAULT false,
	"is_coach" boolean DEFAULT false,
	"is_admin" boolean DEFAULT false,
	"is_fan" boolean DEFAULT true,
	"preferred_role" text,
	"batting_style" text,
	"bowling_style" text,
	"favorite_team" text,
	"favorite_player" text,
	"email_verified" boolean DEFAULT false,
	"phone_number" text,
	"phone_verified" boolean DEFAULT false,
	"verification_badge" boolean DEFAULT false,
	"registration_method" text DEFAULT 'email',
	"last_login_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "venue_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"venue_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_available" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "venue_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"venue_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"purpose" text,
	"number_of_people" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'unpaid',
	"total_amount" numeric,
	"paid_amount" numeric DEFAULT '0',
	"transaction_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tournament_id" integer
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text,
	"country" text NOT NULL,
	"postal_code" text,
	"capacity" integer,
	"facilities" text[],
	"description" text,
	"image_url" text,
	"contact_email" text,
	"contact_phone" text,
	"price_per_hour" numeric,
	"is_active" boolean DEFAULT true,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"latitude" numeric,
	"longitude" numeric
);
--> statement-breakpoint
ALTER TABLE "player_tournament_stats" ADD CONSTRAINT "player_tournament_stats_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_tournament_stats" ADD CONSTRAINT "player_tournament_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_statistics" ADD CONSTRAINT "tournament_statistics_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_statistics" ADD CONSTRAINT "tournament_statistics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_statistics" ADD CONSTRAINT "tournament_statistics_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_availability" ADD CONSTRAINT "venue_availability_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;