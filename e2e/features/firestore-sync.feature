Feature: Firestore sync

  Scenario: Local progress syncs to Firestore on first login
    Given I open the skill tree page
    And I claim the "Review Every Edit" level
    When I sign in as a test user
    Then the Firestore assessment should have autonomy level 2

  Scenario: Firestore data wins on conflict
    Given I open the skill tree page
    And the test user has autonomy level 4 in Firestore
    And I claim the "Review Every Edit" level
    When I sign in as a test user
    Then the "Review Critical Only" node should be claimed
    And the "Review Every Edit" node should be claimed

  Scenario: Changes persist to Firestore while logged in
    Given I open the skill tree page
    And I sign in as a test user
    When I claim the "Review Per Session" level
    Then the Firestore assessment should have autonomy level 3

  Scenario: Progress survives sign-out and sign-in
    Given I open the skill tree page
    And I sign in as a test user
    And I claim the "Manual Parallel" level
    When I sign out
    And I sign in as a test user
    Then the "Manual Parallel" node should be claimed
