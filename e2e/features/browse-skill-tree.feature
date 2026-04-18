Feature: Browse skill tree

  Scenario: View all three skill axes
    Given I open the skill tree page
    Then I should see the "Autonomy" path
    And I should see the "Parallel Execution" path
    And I should see the "Skill Usage" path

  Scenario: Expand a node to see details
    Given I open the skill tree page
    When I click on the "Autocomplete" node
    Then I should see the node detail with "How to reach this level"

  Scenario: Collapse an expanded node
    Given I open the skill tree page
    When I click on the "Autocomplete" node
    And I click on the "Autocomplete" node again
    Then the node detail should be hidden

  Scenario: Only one node expanded per path at a time
    Given I open the skill tree page
    When I click on the "Autocomplete" node
    And I click on the "Review Every Edit" node
    Then the "Autocomplete" node detail should be hidden
    And the "Review Every Edit" node detail should be visible
