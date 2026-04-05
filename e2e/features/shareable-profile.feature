Feature: Shareable profile

  Scenario: Login redirects to profile URL and logout returns home
    Given I open the skill tree page
    And I sign in as a test user
    Then the URL should contain "/profile/"
    And I can still claim skills on my profile
    When I sign out
    Then the URL should be "/"

  Scenario: Share button copies profile link
    Given I open the skill tree page
    And I sign in as a test user
    When I click the share button
    Then I see a "Link copied!" toast

  Scenario: View a shared profile as visitor
    Given a user exists with skills claimed
    When I navigate to their profile URL
    Then I see their display name
    And I see their skill tree in read-only mode
    And I do not see claim or unclaim buttons
    And I see an "Assess your own skills" link

  Scenario: Sign-out resets skill tree to defaults
    Given I open the skill tree page
    And I sign in as a test user
    And I claim the "Review Every Edit" level on my profile
    When I sign out
    Then the "Review Every Edit" node should not be claimed

  Scenario: View a non-existent profile
    When I navigate to "/profile/nonexistent-user-id-12345"
    Then I see a "Profile not found" message
    And I see an "Assess your own skills" link
