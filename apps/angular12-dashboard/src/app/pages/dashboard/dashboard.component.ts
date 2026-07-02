import { Component } from '@angular/core';

export interface StatCard {
  label: string;
  value: string;
}

export interface Activity {
  user: string;
  action: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  stats: StatCard[] = [
    { label: 'Total Users', value: '1,284' },
    { label: 'Monthly Revenue', value: '$42,300' },
    { label: 'Orders Today', value: '87' },
  ];

  activities: Activity[] = [
    { user: 'Alice Johnson', action: 'Created a new report', time: '2 min ago' },
    { user: 'Bob Smith', action: 'Updated user settings', time: '15 min ago' },
    { user: 'Carol White', action: 'Exported data to CSV', time: '1 hr ago' },
    { user: 'David Brown', action: 'Added new product', time: '3 hr ago' },
    { user: 'Eve Davis', action: 'Submitted support ticket', time: '5 hr ago' },
  ];
}
