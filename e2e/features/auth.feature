Feature: Authentication

  Scenario: Sign in button opens sign-in modal
    Given I open the skill tree page
    When I click the login button
    Then I should see the sign-in modal with Google and GitHub options

  Scenario: Sign in updates the header
    Given I open the skill tree page
    And I sign in as a test user
    Then I should see the user avatar in the header
    And I should see a "Sign out" button
    And I should not see "Sign in to save"

  Scenario: Sign out returns to logged-out state
    Given I open the skill tree page
    And I sign in as a test user
    When I sign out
    Then I should see "Sign in to save"
    And I should not see the user avatar
