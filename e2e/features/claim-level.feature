Feature: Claim and unclaim levels

  Scenario: Claim the frontier level
    Given I open the skill tree page
    When I expand the "Review Every Edit" node
    And I click the "This is me" action
    Then the "Review Every Edit" node should be claimed

  Scenario: Claiming a level updates the progress summary
    Given I open the skill tree page
    When I expand the "Review Every Edit" node
    And I click the "This is me" action
    Then the Autonomy progress chip should show "2/6"

  Scenario: Unclaim a level on an axis
    Given I open the skill tree page
    When I expand the "Review Every Edit" node
    And I click the "This is me" action
    And I expand the "Review Every Edit" node
    And I click the "Not here yet" action
    Then the "Review Every Edit" node should not be claimed

  Scenario: Claiming level 3 marks levels 1 and 2 as claimed
    Given I open the skill tree page
    When I expand the "Review Per Session" node
    And I click the "This is me" action
    Then the "Autocomplete" node should be claimed
    And the "Review Every Edit" node should be claimed
    And the "Review Per Session" node should be claimed
