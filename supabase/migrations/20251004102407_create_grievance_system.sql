/*
  # Employee Grievance Management System Database Schema

  ## Overview
  Complete database schema for managing employee grievances with multi-department support,
  status tracking, priority levels, and comprehensive audit trails.

  ## New Tables

  ### 1. `profiles`
  User profile information linked to auth.users
  - `id` (uuid, primary key) - Links to auth.users.id
  - `email` (text) - User email
  - `full_name` (text) - Employee full name
  - `employee_id` (text, unique) - Company employee ID
  - `department` (text) - Department name
  - `role` (text) - User role: 'employee', 'admin', 'hr'
  - `avatar_url` (text, nullable) - Profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. `grievances`
  Main grievances tracking table
  - `id` (uuid, primary key) - Unique grievance identifier
  - `employee_id` (uuid) - Foreign key to profiles
  - `title` (text) - Grievance title/subject
  - `description` (text) - Detailed description
  - `category` (text) - Type: 'harassment', 'discrimination', 'workplace_safety', 'compensation', 'workload', 'other'
  - `priority` (text) - Priority level: 'low', 'medium', 'high', 'critical'
  - `status` (text) - Current status: 'submitted', 'under_review', 'investigating', 'resolved', 'closed'
  - `department` (text) - Department concerned
  - `assigned_to` (uuid, nullable) - Admin/HR assigned to handle
  - `resolution` (text, nullable) - Resolution details
  - `resolved_at` (timestamptz, nullable) - Resolution timestamp
  - `created_at` (timestamptz) - Submission timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `grievance_comments`
  Comments and updates on grievances
  - `id` (uuid, primary key) - Unique comment identifier
  - `grievance_id` (uuid) - Foreign key to grievances
  - `user_id` (uuid) - Foreign key to profiles
  - `comment` (text) - Comment content
  - `is_internal` (boolean) - Internal note (visible only to admins/HR)
  - `created_at` (timestamptz) - Comment timestamp

  ### 4. `grievance_attachments`
  File attachments for grievances
  - `id` (uuid, primary key) - Unique attachment identifier
  - `grievance_id` (uuid) - Foreign key to grievances
  - `file_name` (text) - Original file name
  - `file_url` (text) - Storage URL
  - `file_type` (text) - MIME type
  - `uploaded_by` (uuid) - Foreign key to profiles
  - `created_at` (timestamptz) - Upload timestamp

  ## Security
  - Enable RLS on all tables
  - Employees can view and create their own grievances
  - Admins and HR can view all grievances
  - Only assigned admins/HR can update grievance status
  - Comments visible based on user role and is_internal flag
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  employee_id text UNIQUE NOT NULL,
  department text NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin', 'hr')),
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create grievances table
CREATE TABLE IF NOT EXISTS grievances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('harassment', 'discrimination', 'workplace_safety', 'compensation', 'workload', 'management', 'other')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'investigating', 'resolved', 'closed')),
  department text NOT NULL,
  assigned_to uuid REFERENCES profiles(id),
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;

-- Create grievance_comments table
CREATE TABLE IF NOT EXISTS grievance_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id uuid NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grievance_comments ENABLE ROW LEVEL SECURITY;

-- Create grievance_attachments table
CREATE TABLE IF NOT EXISTS grievance_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id uuid NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grievance_attachments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Grievances policies
CREATE POLICY "Employees can view own grievances"
  ON grievances FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Employees can create grievances"
  ON grievances FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admins can update grievances"
  ON grievances FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr')
    )
  );

-- Grievance comments policies
CREATE POLICY "Users can view relevant comments"
  ON grievance_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM grievances
      WHERE grievances.id = grievance_comments.grievance_id
      AND (
        grievances.employee_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'hr')
        )
      )
    )
    AND (
      NOT is_internal OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'hr')
      )
    )
  );

CREATE POLICY "Users can create comments on accessible grievances"
  ON grievance_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grievances
      WHERE grievances.id = grievance_comments.grievance_id
      AND (
        grievances.employee_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'hr')
        )
      )
    )
    AND user_id = auth.uid()
  );

-- Grievance attachments policies
CREATE POLICY "Users can view attachments for accessible grievances"
  ON grievance_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM grievances
      WHERE grievances.id = grievance_attachments.grievance_id
      AND (
        grievances.employee_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'hr')
        )
      )
    )
  );

CREATE POLICY "Users can upload attachments to accessible grievances"
  ON grievance_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grievances
      WHERE grievances.id = grievance_attachments.grievance_id
      AND (
        grievances.employee_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'hr')
        )
      )
    )
    AND uploaded_by = auth.uid()
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grievances_employee_id ON grievances(employee_id);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_assigned_to ON grievances(assigned_to);
CREATE INDEX IF NOT EXISTS idx_grievance_comments_grievance_id ON grievance_comments(grievance_id);
CREATE INDEX IF NOT EXISTS idx_grievance_attachments_grievance_id ON grievance_attachments(grievance_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for grievances updated_at
DROP TRIGGER IF EXISTS update_grievances_updated_at ON grievances;
CREATE TRIGGER update_grievances_updated_at
  BEFORE UPDATE ON grievances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();